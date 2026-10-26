export const string = { type: 'string' };
export const strings = { type: 'array', items: string };
export const integer = { type: 'integer' };

export const oneOf = (...values: string[]) => ({ type: 'string', enum: values });

export const object = (properties: Record<string, object>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const list = (properties: Record<string, object>) => ({ type: 'array', items: object(properties) });

export const tagged = (tag: string, content: string): string => `<${tag}>\n${content}\n</${tag}>`;
