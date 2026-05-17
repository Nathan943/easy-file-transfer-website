import React from "react";

interface Props {
  name: string;
}

const Name = ({ name }: Props) => {
  return <h4>Your name is: {name}</h4>;
};

export default Name;
