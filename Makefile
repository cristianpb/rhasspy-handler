# Directory to save podcast
# Mopidy saves this in /var/lib/mopidy/media
export PODCAST_DIR=media
# mqtt broker and mopidy hostname
export HOST_MQTT=localhost
export HOST_MOPIDY=localhost
export HOST_RHASSPY=localhost
export HOST_SNAPCAST=localhost
export DEVICE=raspberry

dummy		    := $(shell touch artifacts)
include ./artifacts

${PODCAST_DIR}:
	mkdir -p ${PODCAST_DIR}

node_modules:
	npm install

build: node_modules ${PODCAST_DIR}
	@echo "$(PODCAST_DIR)"
	npm run build

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



# sync code
push:
	rsync -avz --include 'dist' --exclude-from '.gitignore' * raspi:~/rhasspyhandler/

pull:
	rsync -avz --exclude 'src' --exclude-from '.gitignore' --exclude 'Makefile' raspi:~/rhasspyhandler/* .


#./run-venv.sh --profile es
#mosquitto_sub -h localhost -v -t 'hermes/#' -p 1883
