FROM java

RUN apt-get update
RUN apt-get -y upgrade

ENV STARDOG_FILENAME stardog-4.0-RC3.zip
ENV STARDOG_LICENSENAME stardog-license-key.bin

RUN mkdir /stardog
RUN mkdir /data

RUN rm /data/system.lock || :

ADD ./$STARDOG_FILENAME /stardog
ADD ./$STARDOG_LICENSENAME /data

WORKDIR /stardog

RUN unzip $STARDOG_FILENAME
RUN rm $STARDOG_FILENAME
RUN mv stardog* stardog

ENV STARDOG=/stardog/stardog
ENV STARDOG_HOME=/data
ENV PATH="$STARDOG/bin:$PATH"

EXPOSE 5820

CMD stardog-admin server start --foreground