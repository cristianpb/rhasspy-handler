#######################
# Step 1: Base target #
#######################
FROM node:20 as development

ARG NPM_VERBOSE
ARG port
ARG app_path

# Base dir /app
WORKDIR /$app_path

COPY package.json ./

RUN if [ -z "${NPM_VERBOSE}" ]; then\
      npm install;  \
    else \
      npm install --verbose; \
    fi

VOLUME /${app_path}/src
VOLUME /${app_path}/dist
VOLUME /${app_path}/tests
VOLUME /${app_path}/data

COPY tsconfig.json ./

# Expose the listening port of your app
EXPOSE ${port}

CMD ["npm","run", "dev"]

##########################
# Step 3: "build" target #
##########################
FROM development as build
ARG app_path

WORKDIR /$app_path

ADD src ./src

COPY tsconfig.json ./

RUN npm run build && tar czvf dist.tar.gz dist

###############################
# Step 4: "production" target #
###############################
FROM node:20-alpine3.18 as production
ARG port
ARG app_path

WORKDIR /$app_path

COPY package.json ./
ADD tests ./tests
ADD data ./data

## Install production dependencies and clean cache
#RUN npm install --production && \
#    npm cache clean --force

COPY --from=build /${app_path}/node_modules /${app_path}/node_modules
COPY --from=build /${app_path}/dist.tar.gz /${app_path}/

RUN apk --no-cache add curl tar && \
    tar -zxvf dist.tar.gz  && \
    rm -rf dist.tar.gz && apk del tar

# Expose the listening port of your app
EXPOSE ${port}

CMD ["npm","run", "start"]
