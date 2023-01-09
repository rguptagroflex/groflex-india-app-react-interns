// ---------------------------------------------------------------------------- //
//       This file must be copied 1:1 from app/impress to customer-center       //
// ---------------------------------------------------------------------------- //

const themeVariables = {
	backgroundPage: '--impress-color-page-background',
	fontPage: '--impress-color-page-font',
	backgroundNavigation: '--impress-color-nav-background',
	borderNavigation: '--impress-color-nav-border',
	fontNavigation: '--impress-color-nav-font',
	activeNavigationItem: '--impress-color-nav-item-active-background'
};

export const applyTheme = theme => {
	const html = document.getElementsByTagName('html')[0];

	if (theme && theme.items) {
		theme.items.forEach(item => {
			if (themeVariables.hasOwnProperty(item.key)) {
				html.style.setProperty(themeVariables[item.key], item.color);
			}
		});
	}
};

export const impressThemes = [
	{
		title: 'Standard',
		items: [
			{ key: 'backgroundPage', color: '#ffffff' },
			{ key: 'fontPage', color: '#000000' },
			{ key: 'backgroundNavigation', color: '#ffffff' },
			{ key: 'borderNavigation', color: '#E6E6EB' },
			{ key: 'fontNavigation', color: '#222530' },
			{ key: 'activeNavigationItem', color: '#E3E7EF' }
		]
	},
	{
		title: 'Orange-Tan',
		items: [
			{ key: 'backgroundPage', color: '#FAF6E8' },
			{ key: 'fontPage', color: '#524D42' },
			{ key: 'backgroundNavigation', color: '#E5D7BA' },
			{ key: 'borderNavigation', color: '#C1B6AD' },
			{ key: 'fontNavigation', color: '#524D42' },
			{ key: 'activeNavigationItem', color: '#FFA63C' }
		]
	},
	{
		title: 'Blue',
		items: [
			{ key: 'backgroundPage', color: '#F9FBF3' },
			{ key: 'fontPage', color: '#173240' },
			{ key: 'backgroundNavigation', color: '#173240' },
			{ key: 'borderNavigation', color: '#D8E0C2' },
			{ key: 'fontNavigation', color: '#FCFFF5' },
			{ key: 'activeNavigationItem', color: '#3B6373' }
		]
	},
	{
		title: 'Green',
		items: [
			{ key: 'backgroundPage', color: '#F1FCE8' },
			{ key: 'fontPage', color: '#0F2C26' },
			{ key: 'backgroundNavigation', color: '#163B33' },
			{ key: 'borderNavigation', color: '#C0DDA7' },
			{ key: 'fontNavigation', color: '#F2FCE8' },
			{ key: 'activeNavigationItem', color: '#407356' }
		]
	},
	{
		title: 'Raspberry',
		items: [
			{ key: 'backgroundPage', color: '#FCF0D4' },
			{ key: 'fontPage', color: '#331932' },
			{ key: 'backgroundNavigation', color: '#842A39' },
			{ key: 'borderNavigation', color: '#C4B290' },
			{ key: 'fontNavigation', color: '#F9BF72' },
			{ key: 'activeNavigationItem', color: '#621527' }
		]
	},
	{
		title: 'Red Blue',
		items: [
			{ key: 'backgroundPage', color: '#F0F0ED' },
			{ key: 'fontPage', color: '#233A49' },
			{ key: 'backgroundNavigation', color: '#EA4A2F' },
			{ key: 'borderNavigation', color: '#2D9CD1' },
			{ key: 'fontNavigation', color: '#F0F0ED' },
			{ key: 'activeNavigationItem', color: '#233A49' }
		]
	}
];
