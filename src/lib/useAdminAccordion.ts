import { useState } from 'react'
import {
  defaultSectionForGroup,
  nextAdminAccordionId,
  persistAdminAccordionId,
  persistAdminGroupId,
  readAdminAccordionId,
  readAdminGroupId,
  resolveGroupForSection,
  sectionsForGroup,
  type AdminGroupId,
} from './adminAccordion'

export function useAdminAccordion() {
  const [groupId, setGroupId] = useState<AdminGroupId>(() => {
    const openId = readAdminAccordionId()
    const storedGroup = readAdminGroupId()
    if (openId) {
      return resolveGroupForSection(openId)
    }
    return storedGroup
  })
  const [openId, setOpenId] = useState(() => {
    const stored = readAdminAccordionId()
    const group = resolveGroupForSection(stored) || readAdminGroupId()
    const allowed = sectionsForGroup(group).some((section) => section.id === stored)
    return allowed ? stored : defaultSectionForGroup(group)
  })

  function toggle(id: string) {
    setOpenId((prev) => {
      const next = nextAdminAccordionId(prev, id)
      persistAdminAccordionId(next)
      return next
    })
  }

  function setGroup(nextGroup: AdminGroupId) {
    setGroupId(nextGroup)
    persistAdminGroupId(nextGroup)
    const nextOpen = defaultSectionForGroup(nextGroup)
    setOpenId(nextOpen)
    persistAdminAccordionId(nextOpen)
  }

  return {
    groupId,
    setGroup,
    openId,
    toggle,
    sections: sectionsForGroup(groupId),
  }
}
