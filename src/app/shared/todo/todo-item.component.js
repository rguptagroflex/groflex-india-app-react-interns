import React from 'react';
import SelectDatesInputComponent from 'shared/inputs/select-dates-input/select-dates-input.component';
import invoiz from 'services/invoiz.service';
import { parseInterpolationTags } from 'helpers/parseInterpolationTags';
import { TodoInterpolators } from 'helpers/constants';

class TodoItem extends React.Component {
	constructor(props) {
		super(props);
		this.todoRef = React.createRef();
		this.state = {
			isLong: false,
			truncated: false,
		};
		this.createReadMore = this.createReadMore.bind(this);
	}

	componentDidMount() {
		setTimeout(() => {
			this.createReadMore(this.todoRef);
		}, 0);
	}

	createReadMore(ref) {
		if (ref && ref.current) {
			const todoNode = ref.current;
			if (todoNode.clientHeight > 54) {
				this.setState({
					isLong: true,
					truncated: true,
				});
			}
		}
	}

	createCustomerText(item) {
		const { customerId, customerName } = item;
		const url = `customer/${customerId}`;
		if (customerId !== null && !window.location.href.endsWith(url)) {
			return (
				<span className="todo-customer-name">
					zu{' '}
					<span
						onClick={() => {
							if (!window.location.href.endsWith(url)) {
								invoiz.router.navigate(url);
							} else {
								return;
							}
						}}
						className="sub-text text-semibold"
					>
						{customerName}
					</span>
				</span>
			);
		} else {
			return;
		}
	}

	createInvoiceHeaderText(item) {
		if (item) {
			const documentNumberText = item.invoiceNumber === null ? 'Entwurf' : item.invoiceNumber;
			return (
				<span className='todo-document-link'>zu <span className='sub-text text-semibold' onClick={() => invoiz.router.navigate(`invoice/${item.invoiceId}`)}>Rechnung {documentNumberText}</span></span>
			);
		}
	}

	handleToggle() {
		const truncated = !this.state.truncated;
		this.setState({
			truncated,
		});
	}

	render() {
		const { id, dueStatus, doneAt, dueDateSubstring, customerId } = this.props.todo;
		const { additionalClass, todo, changeToDone, onDelete, changeDueDate } = this.props;
		const todoDone = doneAt && doneAt.length !== 0;
		const todoStateString = todoDone ? 'done' : 'open';
		const { truncated, isLong } = this.state;

		let formattedTitle = this.props.todo.formattedTitle;
		formattedTitle = parseInterpolationTags(
			[TodoInterpolators.START, TodoInterpolators.END],
			formattedTitle,
			(tag) => {
				return tag.value;
			}
		);

		let iconText = 'icon icon-check';

		if (dueStatus === 'overdue') {
			iconText = 'icon icon-exclamation_mark icon-overdue';
		} else if (dueStatus === 'actual') {
			iconText = 'icon icon-check icon-actual';
		} else if (dueStatus === 'future') {
			iconText = 'icon icon-check icon-future';
		} else if (dueStatus === 'done') {
			iconText = 'icon icon-check icon-done';
		}

		const todoHeader = (
			<div className="todo-header">
				{customerId ? (
					<React.Fragment>To-Do {this.createCustomerText(todo)}</React.Fragment>
				) : (
					<React.Fragment>To-Do {todo.invoiceId && this.createInvoiceHeaderText(todo)}</React.Fragment>
				)}
			</div>
		);

		const todoBody = (
			<React.Fragment>
				<div
					className={`todo-body todo-body-${todoStateString} ${truncated ? 'truncated' : 'not-truncated'}`}
					ref={this.todoRef}
				>
					<span className="todo-due-date text-semibold">{dueDateSubstring}: </span>
					<span dangerouslySetInnerHTML={{ __html: formattedTitle }}></span>
				</div>
				{isLong && (
					<div className="text text-semibold read-more-button" onClick={() => this.handleToggle()}>
						{truncated ? 'mehr lesen' : 'weniger lesen'}
						<div className={`icon icon-arr_down read-more-icon ${truncated ? '' : 'up'}`} />
					</div>
				)}
			</React.Fragment>
		);

		const todoButtons = (
			<div className="todo-buttons">
				{!todoDone && changeToDone && (
					<div
						onClick={() => {
							changeToDone(id);
						}}
						className="todo-done text-semibold action-text"
					>
						Erledigt
					</div>
				)}
				{onDelete && (
					<div
						onClick={() => {
							onDelete(id);
						}}
						className="todo-delete text-semibold action-text"
					>
						Löschen
					</div>
				)}

				{changeDueDate && (
					<div>
						<SelectDatesInputComponent
							ref={`select-dates-input-${id}`}
							defaultValue={''}
							useChildrenAsLabel={true}
							onChange={(selectedDate) => {
								if (selectedDate && selectedDate.isValid()) {
									changeDueDate(id, selectedDate);
								}
							}}
						>
							Neu datieren
						</SelectDatesInputComponent>
					</div>
				)}
			</div>
		);

		return (
			<div className={`todo-icon-and-content todo-${todoStateString} ${additionalClass || ''}`}>
				<div className="todo-icon-container u_hc">
					<div className={`${iconText}`} />
				</div>

				<div className="todo-content">
					{todoHeader}
					{todoBody}
					{todoButtons}
				</div>
			</div>
		);
	}
}

export default TodoItem;
