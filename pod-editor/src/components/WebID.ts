interface UserWebID {
    id: string
    name?: string
    storage?: string
    oidcIssuer: string
    pathTemplate?: string
}

export type { UserWebID }