import { Provider, createStore, useAtomValue } from 'jotai'
import {
  ComponentType,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useMemo, useRef, useState
} from 'react'
import { typeRenderersAtom } from './atom'
import {
  Store,
  ViewerProps,
  Context,
  Plugin, createContext, TypeRenderer
} from './vanilla'

function ViewerProvider (props: PropsWithChildren<{
  store: Store
}>): ReactElement {
  return (
    <Provider store={props.store}>
      {props.children}
    </Provider>
  )
}

function useTypeRenderer<Value = unknown> (value: Value): TypeRenderer | undefined {
  const typeRenderers = useAtomValue(typeRenderersAtom)
  return useMemo(
    () => typeRenderers.find(
      typeRenderer => typeRenderer.is(value)),
    []
  )
}

function ViewerImpl<Value = unknown> (props: ViewerProps<Value>): ReactElement {
  const typeRenderer = useTypeRenderer(props.value)
  if (!typeRenderer) {
    throw new Error('no type renderer found')
  }
  const Component = typeRenderer.Component as ComponentType<ViewerProps<Value>>
  return (
    <div data-flavour={typeRenderer.flavour}>
      <Component value={props.value}/>
    </div>
  )
}

interface ViewerHookConfig<Value = unknown> {
  store: Store
  context: Context
}

interface CreateViewerHookConfig<Value = unknown> {
  plugins?: Plugin[]
}

export function createViewerHook (config: CreateViewerHookConfig) {
  const store = createStore()
  const context = createContext(store)
  if (config.plugins) {
    const plugins = [...config.plugins].reverse()
    store.set(typeRenderersAtom, plugins.map(plugin => plugin.typeRenderer))
  }

  return function useViewer<Value = unknown> (config?: Omit<ViewerHookConfig<Value>, 'context' | 'store'>) {
    return useBlankViewer({
      context,
      store,
      ...config
    })
  }
}

export function useBlankViewer<Value = unknown> (config?: ViewerHookConfig<Value>) {

  const Viewer = useMemo(() =>
      function Viewer (props: ViewerProps<Value>): ReactElement {
        return (
          <ViewerProvider store={config.store}>
            <ViewerImpl {...props}/>
          </ViewerProvider>
        )
      }
    , []
  )

  return useMemo(() => ({
    Viewer
  }), [])
}
