import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async create(data: { name: string; description?: string }) {
    return this.prisma.role.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.role.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.role.delete({ where: { id } });
    return { message: '角色已删除' };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });

    return { message: '权限分配成功' };
  }
}
