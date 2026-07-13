import React, { useEffect, useState } from "react";

interface Props {
	name: string;
	editName: (name: string) => void;
}

const Name = ({ name, editName }: Props) => {
	const [text, setText] = useState(name);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		setText(name);
	}, [name]);

	return (
		<div
			className="form-control fs-5 border-0 shadow-none m-0 p-2 mt-auto w-100"
			style={{
				fontWeight: "bold",
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap",
				backgroundColor: isHovered ? "#d6d9db" : "transparent",
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{name}
		</div>
	);
};

export default Name;
