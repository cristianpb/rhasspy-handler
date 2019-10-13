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
