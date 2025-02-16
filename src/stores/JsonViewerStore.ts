import type { SetStateAction } from 'react'
import { createContext, useContext } from 'react'
import type { StoreApi } from 'zustand'
import { create, useStore } from 'zustand'

import type {
  JsonViewerOnChange,
  JsonViewerOnCopy,
  JsonViewerOnSelect,
  JsonViewerProps,
  Path
} from '..'
import type { Colorspace } from '../theme/base16'
import { lightColorspace } from '../theme/base16'
import type { JsonViewerKeyRenderer } from '../type'

const DefaultKeyRenderer: JsonViewerKeyRenderer = () => null
DefaultKeyRenderer.when = () => false

export type JsonViewerState<T = unknown> = {
  inspectCache: Record<string, boolean>
  hoverPath: { path: Path; nestedIndex?: number } | null
  indentWidth: number
  groupArraysAfterLength: number
  enableClipboard: boolean
  highlightUpdates: boolean
  maxDisplayLength: number
  defaultInspectDepth: number
  collapseStringsAfterLength: number
  objectSortKeys: boolean | ((a: string, b: string) => number)
  quotesOnKeys: boolean
  colorspace: Colorspace
  editable: boolean | (<U>(path: Path, currentValue: U) => boolean)
  displayDataTypes: boolean
  rootName: false | string
  prevValue: T | undefined
  value: T
  onChange: JsonViewerOnChange
  onCopy: JsonViewerOnCopy | undefined
  onSelect: JsonViewerOnSelect | undefined
  keyRenderer: JsonViewerKeyRenderer
  displayObjectSize: boolean

  getInspectCache: (path: Path, nestedIndex?: number) => boolean
  setInspectCache: (
    path: Path, action: SetStateAction<boolean>, nestedIndex?: number) => void
  setHover: (path: Path | null, nestedIndex?: number) => void
}

export const createJsonViewerStore = <T = unknown> (props: JsonViewerProps<T>) => {
  return create<JsonViewerState>()((set, get) => ({
    // provided by user
    enableClipboard: props.enableClipboard ?? true,
    highlightUpdates: props.highlightUpdates ?? false,
    indentWidth: props.indentWidth ?? 3,
    groupArraysAfterLength: props.groupArraysAfterLength ?? 100,
    collapseStringsAfterLength:
      (props.collapseStringsAfterLength === false)
        ? Number.MAX_VALUE
        : props.collapseStringsAfterLength ?? 50,
    maxDisplayLength: props.maxDisplayLength ?? 30,
    rootName: props.rootName ?? 'root',
    onChange: props.onChange ?? (() => {}),
    onCopy: props.onCopy ?? undefined,
    onSelect: props.onSelect ?? undefined,
    keyRenderer: props.keyRenderer ?? DefaultKeyRenderer,
    editable: props.editable ?? false,
    defaultInspectDepth: props.defaultInspectDepth ?? 5,
    objectSortKeys: props.objectSortKeys ?? false,
    quotesOnKeys: props.quotesOnKeys ?? true,
    displayDataTypes: props.displayDataTypes ?? true,
    // internal state
    inspectCache: {},
    hoverPath: null,
    colorspace: lightColorspace,
    value: props.value,
    prevValue: undefined,
    displayObjectSize: props.displayObjectSize ?? true,

    getInspectCache: (path, nestedIndex) => {
      const target = nestedIndex !== undefined
        ? path.join('.') +
            `[${nestedIndex}]nt`
        : path.join('.')
      return get().inspectCache[target]
    },
    setInspectCache: (path, action, nestedIndex) => {
      const target = nestedIndex !== undefined
        ? path.join('.') +
            `[${nestedIndex}]nt`
        : path.join('.')
      set(state => ({
        inspectCache: {
          ...state.inspectCache,
          [target]: typeof action === 'function'
            ? action(
              state.inspectCache[target])
            : action
        }
      }))
    },
    setHover: (path, nestedIndex) => {
      set({
        hoverPath: path
          ? ({ path, nestedIndex })
          : null
      })
    }
  }))
}

// @ts-expect-error we intentionally want to pass undefined to the context
// See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24509#issuecomment-382213106
export const JsonViewerStoreContext = createContext<StoreApi<JsonViewerState>>(undefined)

export const JsonViewerProvider = JsonViewerStoreContext.Provider

export const useJsonViewerStore = <U extends unknown>(selector: (state: JsonViewerState) => U, equalityFn?: (a: U, b: U) => boolean) => {
  const store = useContext(JsonViewerStoreContext)
  return useStore(store, selector, equalityFn)
}
