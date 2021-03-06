import React from 'react';
import cn from 'classnames';
import styles from './Avatar.scss';

export type TAvatarSize = 'tiny' | 'small' | 'medium' | 'large';
export type TAvatarShape = 'round' | 'square';

export interface IAvatarProps {
  image?: JSX.Element;
  src?: string;
  size?: TAvatarSize;
  shape?: TAvatarShape;
}

export const Avatar = ({
  image,
  src,
  size = 'medium',
  shape = 'round'
}: IAvatarProps): JSX.Element => {
  const rootclassNames = cn(styles.Avatar, styles[size], styles[shape]);

  let img: React.ReactNode;
  if (src) {
    img = <img src={src} />;
  } else if (image) {
    img = image;
  } else {
    img = '@todo - placeholder image';
  }

  return <div className={rootclassNames}>{img}</div>;
};

export default Avatar;
