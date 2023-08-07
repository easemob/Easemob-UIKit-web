import React from 'react';
import './style/style.scss';
import Icon from '../icon';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';

export interface LoadingProps {
  prefix?: string;
  className?: string;
  visible?: boolean;
  size?: number;
}
const Loading = (props: LoadingProps) => {
  const { visible, prefix, className, size = 48 } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('loading', prefix);
  const classes = classNames(prefixCls, className);
  return (
    <>
      {visible && (
        <div className={classes}>
          <Icon className="circle" type="LOADING" width={size} height={size}></Icon>
        </div>
      )}
    </>
  );
};

export { Loading };
