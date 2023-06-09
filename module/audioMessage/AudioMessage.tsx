import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { AudioMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import { AudioPlayer } from './AudioPlayer';
import rootStore from '../store/index';
export interface AudioMessageProps extends Omit<BaseMessageProps, 'bubbleType'> {
  audioMessage: AudioMessageType; // 从SDK收到的文件消息
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  type?: 'primary' | 'secondly';
}

const AudioMessage = (props: AudioMessageProps) => {
  const [isPlaying, setPlayStatus] = useState(false);
  const {
    audioMessage,
    direction,
    style: customStyle,
    prefix: customizePrefixCls,
    className,
    type,
    ...others
  } = props;

  const audioRef = useRef(null);
  const { url, file_length, length, file, time: messageTime, from, status } = audioMessage;
  // const duration = body.length
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-audio', customizePrefixCls);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: !!type,
    },
    className,
  );

  const playAudio = () => {
    setPlayStatus(true);
    (audioRef as unknown as React.MutableRefObject<HTMLAudioElement>).current
      .play()
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log('err', err);
      });
    // const time = audioMessage!.body!.length * 1000;
    // const time = file.duration * 1000;
    // setTimeout(() => {
    // 	setPlayStatus(false);
    // }, time + 200);
  };
  const handlePlayEnd = () => {
    setPlayStatus(false);
  };

  const duration = length || file.duration;
  const style = {
    width: `calc(208px * ${duration / 15} + 40px)`,
    maxWidth: '50vw',
  };
  let { bySelf } = audioMessage;
  if (typeof bySelf == 'undefined') {
    bySelf = from == rootStore.client.context.userId;
  }
  const bubbleType = type ? type : bySelf ? 'primary' : 'secondly';
  return (
    <BaseMessage
      direction={bySelf ? 'rtl' : 'ltr'}
      style={customStyle}
      time={messageTime}
      nickName={from}
      status={status}
      bubbleType={bubbleType}
      {...others}
    >
      <div className={classString} onClick={playAudio} style={{ ...style }}>
        <AudioPlayer play={isPlaying} reverse={bySelf} size={20}></AudioPlayer>
        <span className={`${prefixCls}-duration`}>{duration + '"' || 0}</span>
        <audio
          src={file.url || url}
          ref={audioRef}
          onEnded={handlePlayEnd}
          onError={handlePlayEnd}
          onStalled={handlePlayEnd}
        />
      </div>
    </BaseMessage>
  );
};

export { AudioMessage };
