# Web-Command-Bridge
this extension will scan the webpage for the valid commands and runs them into the shell , if you want to grant full access to the shell in native_host.py set the shell to True .

## How to install :
clone the repo :
```sh
git clone https://github.com/SkillfulElectro/Web-Command-Bridge.git
```
go to chrome extensions in dev mode , load unpacked the repo
edit com.my_app.native_host.json file
copy it to `.config/chromium/NativeMessagingHosts/
`
and you are ready to go .

## Commands 
- sample command :
```
start_execute_on_os_command
        echo "The native host is working perfectly!" > proof.txt
        end_execute_on_os_command
```
