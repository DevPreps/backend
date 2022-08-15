import { PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

const Tags = (prismaTag: PrismaClient["tag"]) => {
    return prismaTag
}

const tagModel = Tags(prisma.tag)

export default tagModel;