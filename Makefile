# Directory to save podcast
# Mopidy saves this in /var/lib/mopidy/media
export APP = rhasspyhandler
export APP_PATH := $(shell pwd)
export PODCAST_DIR=media
export NPM_VERBOSE ?= 1
export DEVICE=raspberry
export PORT=8000

dummy		    := $(shell touch artifacts)
include ./artifacts

${PODCAST_DIR}:
	mkdir -p ${PODCAST_DIR}

build:
	@export EXEC_ENV=production; \
		docker compose build

dev:
	@export EXEC_ENV=development; \
		docker compose up --build

up: ${PODCAST_DIR}
	@export EXEC_ENV=production; \
		docker compose up

test: ${PODCAST_DIR}
	npm run test

# sync code
push:
	rsync -avz dist raspi:~/rhasspyhandler/

pull:
	rsync -avz raspi:~/rhasspyhandler/rhasspy .


#./run-venv.sh --profile es
#mosquitto_sub -h localhost -v -t 'hermes/#' -p 1883
