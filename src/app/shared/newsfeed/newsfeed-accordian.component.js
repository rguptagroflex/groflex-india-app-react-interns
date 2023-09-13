import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
const NewsFeedAccordian = ({ heading, secondaryHeading, content, item, onPrimaryClick, onSecondaryClick, read }) => {
	const [expanded, setExpanded] = useState(false);
	const handlePrimaryClick = (item) => {
		onPrimaryClick(item);
	};

	const handleSecondaryClick = (item) => {
		console.log(item);
		onSecondaryClick(item);
	};

	function TruncatedText({ text, maxLength }) {
		if (expanded) {
			return <span>{text}</span>;
		} else {
			const truncatedText = text.substring(0, maxLength) + "...";
			return <span>{truncatedText}</span>;
		}
	}
	return (
		<div className="accordian-main">
			<div className="accordian-head">
				<div className="accordian-heading">{heading.charAt(0).toUpperCase() + heading.slice(1)}</div>
				<div className="accordian-head-sub">
					<div className="accordian-date">{secondaryHeading}</div>
					<div className="accordian-icon" onClick={() => setExpanded(!expanded)}>
						{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
					</div>
				</div>
			</div>

			<div className="accordian-body">
				<TruncatedText text={content} maxLength={50} />
				{/* <div className="accordian-content">{content}</div> */}
			</div>
			<div className="accordian-button">
				{read ? (
					<div>
						<Button
							style={{
								color: "#00A353",
								textTransform: "none",
								padding: 0,
							}}
							onClick={() => handleSecondaryClick(item)}
						>
							view
						</Button>
					</div>
				) : (
					<div>
						<Button
							style={{
								color: "#00A353",
								textTransform: "none",
								padding: 0,
							}}
							onClick={() => handlePrimaryClick(item)}
						>
							Mark as read
						</Button>
						<Button
							style={{
								color: "#00A353",
								textTransform: "none",
								padding: 0,
							}}
							onClick={() => handleSecondaryClick(item)}
						>
							view
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

export default NewsFeedAccordian;
