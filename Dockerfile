FROM node

RUN apt-get update
RUN apt-get -y upgrade

CMD npm test
