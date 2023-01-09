import React from 'react';
import PropTypes from 'prop-types';
import TextWithTagsInput from '../inputs/text-with-categories-input/shared/inputs/text-with-tags-input/text-with-tags-input.component';
import TextWithCategoriesInput from 'shared/inputs/text-with-categories-input/text-with-categories-input.component';

const tabs = {
	ACTIVITY: 'activity',
	TODO: 'todo',
};

class TodoActivityTabsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			activeTab: props.activeTab,
		};
	}

	render() {
		const { wrapperClass, onActivitySubmit, onTodoSubmit, onCategoryAdd, activityOptions } = this.props;
		const { activeTab } = this.state;

		return (
			<div className={`todo-activity-tabs-component ${wrapperClass || ''}`}>
				<div className="todo-activity-tabs u_vc">
					<div
						className={`todo-activity-tab uppercase ${activeTab === tabs.ACTIVITY ? 'active-tab' : null}`}
						onClick={() => {
							this.setState({ activeTab: tabs.ACTIVITY });
						}}
					>
						Aktivität
					</div>
					<div
						className={`todo-activity-tab uppercase ${activeTab === tabs.TODO ? 'active-tab' : null}`}
						onClick={() => {
							this.setState({ activeTab: tabs.TODO });
						}}
					>
						To-Do
					</div>
				</div>
				<div className="todo-activity-tab-content">
					{activeTab === tabs.ACTIVITY && (
						<TextWithCategoriesInput
							options={activityOptions}
							defaultOption="Notiz"
							placeholder="Aktivität hinzufügen"
							dataQsId="create-activity-type-select"
							onCategoryAdd={(category, callback) => {
								onCategoryAdd && onCategoryAdd(category, callback);
							}}
							onSubmit={(activity) => {
								onActivitySubmit && onActivitySubmit(activity);
							}}
						/>
					)}
					{activeTab === tabs.TODO && (
						<TextWithTagsInput
							hasDateSelect={true}
							focusOnRender={true}
							tagifySettings={{
								placeholder: 'To-Do hinzufügen',
							}}
							onTagSubmit={(todo) => {
								onTodoSubmit && onTodoSubmit(todo);
							}}
						/>
					)}
				</div>
			</div>
		);
	}
}

TodoActivityTabsComponent.propTypes = {
	activeTab: PropTypes.string,
	activityOptions: PropTypes.array.isRequired,
	onActivitySubmit: PropTypes.func,
	onCategoryAdd: PropTypes.func,
	onTodoSubmit: PropTypes.func,
};

TodoActivityTabsComponent.defaultProps = {
	activeTab: tabs.ACTIVITY,
};

export default TodoActivityTabsComponent;
