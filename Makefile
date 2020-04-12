# Directory to save podcast
# Mopidy saves this in /var/lib/mopidy/media
export PODCAST_DIR=media
# mqtt broker address
export HOST="localhost"
export DEVICE="raspberry"

dummy		    := $(shell touch artifacts)
include ./artifacts

${PODCAST_DIR}:
	mkdir -p ${PODCAST_DIR}

node_modules:
	npm install

dev: node_modules ${PODCAST_DIR}
	@echo "$(PODCAST_DIR)"
	npm run dev

up: node_modules ${PODCAST_DIR}
	@echo "$(PODCAST_DIR)"
	npm run start

test: node_modules ${PODCAST_DIR}
	@echo "$(PODCAST_DIR)"
	npm run test

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
