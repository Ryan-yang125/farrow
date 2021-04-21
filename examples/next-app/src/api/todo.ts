/**
 * This file was generated by farrow-api
 * Don't modify it manually
 */

import { createApiPipelineWithUrl, ApiInvokeOptions } from 'farrow-api-client'

/**
 * {@label AddTodoInput}
 */
export type AddTodoInput = {
  /**
   * @remarks a content of todo for creating
   */
  content: string
}

/**
 * {@label AddTodoOutput}
 */
export type AddTodoOutput = {
  /**
   * @remarks Todo list
   */
  todos: Todo[]
}

/**
 * {@label Todo}
 */
export type Todo = {
  /**
   * @remarks Todo id
   */
  id: number
  /**
   * @remarks Todo content
   */
  content: string
  /**
   * @remarks Todo status
   */
  completed: boolean
  /**
   * @remarks Todo create time
   */
  createAt?: string | null | undefined
}

/**
 * {@label RemoveTodoInput}
 */
export type RemoveTodoInput = {
  /**
   * @remarks Todo id for removing
   */
  id: number
}

/**
 * {@label RemoveTodoOuput}
 */
export type RemoveTodoOuput = {
  /**
   * @remarks Remain todo list
   */
  todos: Todo[]
}

export const url = 'http://localhost:3002/api/todo'

export const apiPipeline = createApiPipelineWithUrl(url)

export const api = {
  /**
   * @remarks add todo
   */
  addTodo: (input: AddTodoInput, options?: ApiInvokeOptions) =>
    apiPipeline.invoke({ type: 'Single', path: ['addTodo'], input }, options) as Promise<AddTodoOutput>,
  /**
   * @remarks remove todo
   */
  removeTodo: (input: RemoveTodoInput, options?: ApiInvokeOptions) =>
    apiPipeline.invoke({ type: 'Single', path: ['removeTodo'], input }, options) as Promise<RemoveTodoOuput>,
}
