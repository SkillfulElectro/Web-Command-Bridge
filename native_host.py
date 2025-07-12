#!/usr/bin/env python3

import sys
import json
import struct
import subprocess
import re
import shlex
from pathlib import Path # Import the modern path library

def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message_content):
    encoded_content = json.dumps(message_content).encode('utf-8')
    encoded_length = struct.pack('@I', len(encoded_content))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()

def process_command(text):
    try:
        match = re.search(r'start_execute_on_os_command\s*(.*?)\s*end_execute_on_os_command', text, re.DOTALL)
        if not match:
            return {"status": "error", "stderr": "Could not find valid command markers."}
        
        shell_command = match.group(1).strip()
        if not shell_command:
            return {"status": "error", "stderr": "Command is empty."}

        output_file_name = None
        command_part = shell_command
        
        if '>' in shell_command:
            parts = shell_command.split('>', 1)
            command_part = parts[0].strip()
            output_file_name = parts[1].strip()
            
            # Security: prevent path traversal and absolute paths from the user
            if '..' in output_file_name or '/' in output_file_name or '\\' in output_file_name:
                return {"status": "error", "stderr": "Invalid filename. No paths allowed."}

        args = shlex.split(command_part)
        
        result = subprocess.run(args, shell=False, capture_output=True, text=True, check=False)

        if output_file_name:
            if result.returncode == 0:
                ### CRITICAL CHANGE HERE ###
                # We construct a full, absolute path inside the user's home directory.
                home_dir = Path.home()
                full_output_path = home_dir / output_file_name
                
                with open(full_output_path, 'w', encoding='utf-8') as f:
                    f.write(result.stdout)
                
                # Report the full path back to the user so they know where to find it.
                return {
                    "status": "success",
                    "stdout": f"Output successfully written to {full_output_path}",
                    "stderr": result.stderr,
                    "returncode": result.returncode
                }
            else:
                return {"status": "error", "stdout": result.stdout, "stderr": f"Command failed. Error: {result.stderr}", "returncode": result.returncode}
        else:
            return {"status": "success" if result.returncode == 0 else "error", "stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}

    except FileNotFoundError:
        return {"status": "error", "stderr": f"Command not found: '{shlex.split(shell_command)[0]}'", "returncode": 127}
    except Exception as e:
        return {"status": "error", "stderr": f"Host script error: {str(e)}"}

if __name__ == '__main__':
    while True:
        try:
            message = get_message()
            if 'command_text' in message:
                response = process_command(message['command_text'])
                send_message(response)
        except (json.JSONDecodeError, struct.error):
            sys.exit(0)
        except Exception as e:
            send_message({"status": "error", "stderr": f"A critical host error occurred: {str(e)}"})
            sys.exit(1)
