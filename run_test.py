import sys
import json
import struct
import subprocess

# The command we want to test
test_command = """
        start_execute_on_os_command
        
        echo "The native host is working perfectly!" > proof.txt
        end_execute_on_os_command
"""

# The message structure the browser would send
message_to_send = {"command_text": test_command}

# Correctly pack the message with the 4-byte length header
encoded_message = json.dumps(message_to_send).encode('utf-8')
message_length_header = struct.pack('@I', len(encoded_message))

# Start the native_host.py script as a separate process
process = subprocess.Popen(
    ['python3', 'native_host.py'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Send the message to the script's stdin
process.stdin.write(message_length_header)
process.stdin.write(encoded_message)
process.stdin.close() # Signal that we're done writing

# Read the response from the script's stdout
response_length_header = process.stdout.read(4)
if response_length_header:
    response_length = struct.unpack('@I', response_length_header)[0]
    response_body = process.stdout.read(response_length).decode('utf-8')
    
    print("SUCCESS: Received response from native host:")
    print(json.dumps(json.loads(response_body), indent=2))
else:
    print("FAILURE: Did not receive a response from native host.")
    # Print any errors from the script
    stderr_output = process.stderr.read().decode('utf-8')
    if stderr_output:
        print("\nErrors from native_host.py:")
        print(stderr_output)

process.stdout.close()
process.stderr.close()
process.wait()

