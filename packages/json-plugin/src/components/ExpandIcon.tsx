import type { ReactElement } from 'react'
import { lazy } from 'react'

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
const IconChevronDown = lazy(() => import('@tabler/icons-react/dist/esm/icons/IconChevronDown.js'))

export type ExpandIconProps = {
  expand: boolean
}

export function ExpandIcon ({ expand }: ExpandIconProps): ReactElement {
  return (
    <IconChevronDown
      className="rich-data--viewer-icon interactive"
      transform={
        expand ? 'rotate(0)' : 'rotate(-90)'
      }/>
  )
}
