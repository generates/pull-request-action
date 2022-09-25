FROM node:18-buster

RUN mkdir -p /opt/pull-request-action

COPY yarn.lock /opt/pull-request-action
COPY package.json /opt/pull-request-action
RUN cd /opt/pull-request-action && yarn && cd $HOME

COPY index.js /opt/pull-request-action

CMD ["node", "/opt/pull-request-action"]
