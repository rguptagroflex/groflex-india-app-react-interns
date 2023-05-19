import React from "react";
import { useEffect, useRef } from "react";

export default function OnClickOutside({ onClickOutside, children, rest, style }) {
	const ref = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (ref.current && !ref.current.contains(event.target)) {
				onClickOutside && onClickOutside();
			}
		};
		document.addEventListener("click", handleClickOutside, true);
		return () => {
			document.removeEventListener("click", handleClickOutside, true);
		};
	}, [onClickOutside]);

	return (
		<div style={style} {...rest} ref={ref}>
			{children}
		</div>
	);
}
