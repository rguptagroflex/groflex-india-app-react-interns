import React from 'react';

const OnboardTile = ({ btype, classes, tileClick }) => {
	return (
		<div className={classes} onClick={() => tileClick(btype)}>
			{btype.value}
		</div>
	);
};

export default OnboardTile;
