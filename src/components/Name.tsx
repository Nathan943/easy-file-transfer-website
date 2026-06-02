import React, { useEffect, useState } from "react";

interface Props {
	name: string;
	editName: (name: string) => void;
}

const Name = ({ name, editName }: Props) => {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(name);

	useEffect(() => {
		setText(name);
	}, [name]);

	return (
		<input
			type="text"
			className={
				isEditing
					? "form-control fs-5 mt-auto"
					: "form-control fs-5 border-0 shadow-none bg-transparent m-1 p-0 mt-auto"
			}
			style={{
				fontWeight: "bold",
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap",
			}}
			value={text}
			onChange={(e) => setText(e.target.value)}
			onFocus={() => setIsEditing(true)}
			onBlur={() => {
				setIsEditing(false);
				editName(text);
			}}
		/>
	);
};

export default Name;
