const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const abbreviationDateFormat = (date, seperator = "-") => {
	const dateArr = date.split(seperator);
	date = { day: dateArr[0], month: dateArr[1], year: dateArr[2] };
	return `${months[Number(date.month) - 1]} ${date.day}, ${date.year}`;
};

export default abbreviationDateFormat;

export const dateObjToAbbreviation = (date) => {
	const dateObj = new Date(date);
	const month = months[dateObj.getMonth()];
	const day = dateObj.getDate();
	const year = dateObj.getFullYear();
	const finalDate = `${month} ${day}, ${year}`;
	return finalDate;
};
