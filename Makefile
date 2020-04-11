include .env

${PODCAST_DIR}:
	mkdir -p ${PODCAST_DIR}

.env:
	@echo "Taking default values from .env.sample"
	cp .env.sample .env

node_modules:
	npm install

up: .env node_modules ${PODCAST_DIR}
	@echo "$(PODCAST_DIR)"
	node index.js

clean:
	rm -rf node_modules

# ansible

ping:
	ansible -i conf/inventory.conf -m ping all

snips_install_assistant:
	ansible-playbook -i conf/inventory.conf --extra-vars "assistant_file=$(assistant_file)" ansible/install_assistant.yml

ansible_raspimov:
	ansible-playbook -i conf/inventory.conf ansible/raspimov_dep.yml

# sync code
push:
	rsync -avz --exclude-from '.gitignore' * raspi:~/snipshandler/

pull:
	rsync -avz --exclude-from '.gitignore' --exclude 'Makefile' raspi:~/snipshandler/* .


#./run-venv.sh --profile es
#mosquitto_sub -h localhost -v -t 'hermes/#' -p 1883
