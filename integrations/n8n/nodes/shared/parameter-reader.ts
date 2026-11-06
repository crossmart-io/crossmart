import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { LIST_SEPARATOR } from './crossmart.constants';

/** Whether `value` is one of the values of a string enum. */
export function isEnumValue<Member extends string>(
	enumObject: Record<string, Member>,
	value: unknown,
): value is Member {
	return Object.values<Member>(enumObject).some((member) => member === value);
}

const isDataObject = (value: unknown): value is IDataObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** A comma-separated text as a list of trimmed, non-empty values. */
export function splitList(value: string): string[] {
	return value
		.split(LIST_SEPARATOR)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

/** A text field of a collection, or undefined when it is missing or empty. */
export function stringField(collection: IDataObject, key: string): string | undefined {
	const value = collection[key];
	return typeof value === 'string' && value !== '' ? value : undefined;
}

/** A number field of a collection, or undefined when it is missing. */
export function numberField(collection: IDataObject, key: string): number | undefined {
	const value = collection[key];
	return typeof value === 'number' ? value : undefined;
}

/** A comma-separated field of a collection as a list, or undefined when it is missing. */
export function listField(collection: IDataObject, key: string): string[] | undefined {
	const value = stringField(collection, key);
	return value === undefined ? undefined : splitList(value);
}

/** An enum field of a collection, or undefined when it is missing. */
export function enumField<Member extends string>(
	collection: IDataObject,
	key: string,
	enumObject: Record<string, Member>,
): Member | undefined {
	const value = collection[key];
	return isEnumValue(enumObject, value) ? value : undefined;
}

/** The objects of a list field, such as the entries of a fixed collection. */
export function objectListField(collection: IDataObject, key: string): IDataObject[] {
	const value = collection[key];
	return Array.isArray(value) ? value.filter(isDataObject) : [];
}

/** Reads the node's parameters for one input item, checking their types. */
export class ParameterReader {
	constructor(
		private readonly context: IExecuteFunctions,
		readonly itemIndex: number,
	) {}

	string(name: string): string {
		const value = this.context.getNodeParameter(name, this.itemIndex);
		if (typeof value !== 'string') throw this.invalid(name);
		return value;
	}

	number(name: string): number {
		const value = this.context.getNodeParameter(name, this.itemIndex);
		if (typeof value !== 'number') throw this.invalid(name);
		return value;
	}

	boolean(name: string): boolean {
		const value = this.context.getNodeParameter(name, this.itemIndex, false);
		if (typeof value !== 'boolean') throw this.invalid(name);
		return value;
	}

	enumValue<Member extends string>(name: string, enumObject: Record<string, Member>): Member {
		const value = this.context.getNodeParameter(name, this.itemIndex);
		if (!isEnumValue(enumObject, value)) throw this.invalid(name);
		return value;
	}

	/** A collection or fixed collection parameter; empty when the user set nothing. */
	collection(name: string): IDataObject {
		const value = this.context.getNodeParameter(name, this.itemIndex, {});
		if (!isDataObject(value)) throw this.invalid(name);
		return value;
	}

	private invalid(name: string): NodeOperationError {
		return new NodeOperationError(this.context.getNode(), `The parameter "${name}" is not valid`, {
			itemIndex: this.itemIndex,
		});
	}
}
