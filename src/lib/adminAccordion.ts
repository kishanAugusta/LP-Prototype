export const ADMIN_ACCORDION_STORAGE_KEY = 'lp-admin-accordion'
export const ADMIN_GROUP_STORAGE_KEY = 'lp-admin-group'
export const ADMIN_ACCORDION_DEFAULT = 'provision'
export const ADMIN_GROUP_DEFAULT = 'users'

export const ADMIN_GROUPS = [
  {
    id: 'users',
    label: 'Users',
    description: 'Provision access and manage the directory.',
    sectionIds: ['provision', 'directory'] as const,
  },
  {
    id: 'master',
    label: 'Master data',
    description: 'Farms, commodities, activities, and calibration.',
    sectionIds: ['entities', 'calibration'] as const,
  },
  {
    id: 'ops',
    label: 'Ops config',
    description: 'Reports, farm shifts, and operational guardrails.',
    sectionIds: ['report', 'shifts', 'guardrails'] as const,
  },
] as const

export type AdminGroupId = (typeof ADMIN_GROUPS)[number]['id']

export const ADMIN_SECTIONS = [
  { id: 'provision', title: 'Provision user via SSO', groupId: 'users' },
  { id: 'directory', title: 'User directory', groupId: 'users' },
  {
    id: 'entities',
    title: 'Manage farms, commodities, activities',
    groupId: 'master',
  },
  {
    id: 'calibration',
    title: 'Activity speed calibration',
    groupId: 'master',
  },
  { id: 'report', title: 'Planning report provisioning', groupId: 'ops' },
  { id: 'shifts', title: 'Daily farm shift scheduler', groupId: 'ops' },
  { id: 'guardrails', title: 'Operational guardrails', groupId: 'ops' },
] as const

export type AdminSectionId = (typeof ADMIN_SECTIONS)[number]['id']

export function readAdminAccordionId(): string {
  try {
    return sessionStorage.getItem(ADMIN_ACCORDION_STORAGE_KEY) || ADMIN_ACCORDION_DEFAULT
  } catch {
    return ADMIN_ACCORDION_DEFAULT
  }
}

export function readAdminGroupId(): AdminGroupId {
  try {
    const raw = sessionStorage.getItem(ADMIN_GROUP_STORAGE_KEY)
    if (ADMIN_GROUPS.some((group) => group.id === raw)) {
      return raw as AdminGroupId
    }
  } catch {
    /* private mode / blocked storage */
  }
  return ADMIN_GROUP_DEFAULT
}

export function nextAdminAccordionId(current: string, toggledId: string): string {
  return current === toggledId ? '' : toggledId
}

export function persistAdminAccordionId(openId: string): void {
  try {
    sessionStorage.setItem(ADMIN_ACCORDION_STORAGE_KEY, openId || ADMIN_ACCORDION_DEFAULT)
  } catch {
    /* private mode / blocked storage */
  }
}

export function persistAdminGroupId(groupId: AdminGroupId): void {
  try {
    sessionStorage.setItem(ADMIN_GROUP_STORAGE_KEY, groupId)
  } catch {
    /* private mode / blocked storage */
  }
}

export function sectionsForGroup(groupId: AdminGroupId) {
  return ADMIN_SECTIONS.filter((section) => section.groupId === groupId)
}

export function resolveGroupForSection(sectionId: string): AdminGroupId {
  const section = ADMIN_SECTIONS.find((item) => item.id === sectionId)
  return section?.groupId ?? ADMIN_GROUP_DEFAULT
}

export function defaultSectionForGroup(groupId: AdminGroupId): AdminSectionId {
  const first = sectionsForGroup(groupId)[0]
  return first?.id ?? ADMIN_ACCORDION_DEFAULT
}
