export assistant_file := $(shell ls ${PWD}/conf/assistant_*.zip)

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

ping:
	ansible -i conf/inventory.conf -m ping all

snips_install_assistant:
	ansible-playbook -i conf/inventory.conf --extra-vars "assistant_file=$(assistant_file)" ansible/install_assistant.yml

ansible_raspimov:
	ansible-playbook -i conf/inventory.conf ansible/raspimov_dep.yml
