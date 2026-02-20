import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdminAndPermissions() {
  // 创建默认管理员
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      username: 'admin',
      nickname: '管理员',
      isAdmin: true,
    },
  });
  console.log('创建管理员:', admin.email);

  // 创建默认角色
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: '管理员角色',
    },
  });
  console.log('创建角色:', adminRole.name);

  // 创建基础权限
  const permissions = [
    { name: '商品查看', code: 'product:read', module: 'product' },
    { name: '商品创建', code: 'product:create', module: 'product' },
    { name: '商品更新', code: 'product:update', module: 'product' },
    { name: '商品删除', code: 'product:delete', module: 'product' },
    { name: '用户查看', code: 'user:read', module: 'user' },
    { name: '用户更新', code: 'user:update', module: 'user' },
    { name: '订单查看', code: 'order:read', module: 'order' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log('创建权限:', permissions.length, '个');

  // 为管理员角色分配所有权限
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('为管理员分配权限完成');

  return { admin, adminRole };
}

async function seedSiteConfigs() {
  const configs = [
    { key: 'register_points', value: '100', description: '注册赠送积分' },
    { key: 'order_points', value: '10', description: '订单赠送积分（每1元）' },
    { key: 'site_name', value: '返利折扣网', description: '站点名称' },
    { key: 'site_slogan', value: '每天都有新优惠', description: '站点标语' },
  ];

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('创建网站配置:', configs.length, '个');
}

async function seedCategoriesAndBrands() {
  // 顶级分类
  const parentCategories = await Promise.all([
    prisma.category.upsert({
      where: { name: '数码家电' },
      update: {},
      create: {
        name: '数码家电',
        description: '热门数码与家用电器',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: '居家生活' },
      update: {},
      create: {
        name: '居家生活',
        description: '居家好物与生活用品',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: '美妆个护' },
      update: {},
      create: {
        name: '美妆个护',
        description: '美妆个护与日常护理',
        sortOrder: 3,
      },
    }),
  ]);

  // 子分类
  const [digital, home, beauty] = parentCategories;

  const childCategories = await Promise.all([
    prisma.category.upsert({
      where: { name: '手机' },
      update: {},
      create: {
        name: '手机',
        description: '热门手机与配件',
        parentId: digital.id,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: '电脑办公' },
      update: {},
      create: {
        name: '电脑办公',
        description: '笔记本电脑与外设',
        parentId: digital.id,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: '厨房用品' },
      update: {},
      create: {
        name: '厨房用品',
        description: '锅具、厨具与小家电',
        parentId: home.id,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: '收纳整理' },
      update: {},
      create: {
        name: '收纳整理',
        description: '收纳箱与家居收纳',
        parentId: home.id,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: '面部护理' },
      update: {},
      create: {
        name: '面部护理',
        description: '洁面、水乳与精华',
        parentId: beauty.id,
        sortOrder: 1,
      },
    }),
  ]);

  console.log(
    '创建分类完成，顶级分类:',
    parentCategories.length,
    '个，子分类:',
    childCategories.length,
    '个',
  );

  // 品牌
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'Apple' },
      update: {},
      create: {
        name: 'Apple',
        description: '苹果官方授权产品',
        logo: 'https://dummyimage.com/80x80/000/fff&text=Apple',
      },
    }),
    prisma.brand.upsert({
      where: { name: 'Xiaomi' },
      update: {},
      create: {
        name: 'Xiaomi',
        description: '小米智能设备与家电',
        logo: 'https://dummyimage.com/80x80/f97316/fff&text=MI',
      },
    }),
    prisma.brand.upsert({
      where: { name: 'Sony' },
      update: {},
      create: {
        name: 'Sony',
        description: '索尼影音与电子产品',
        logo: 'https://dummyimage.com/80x80/0f172a/fff&text=Sony',
      },
    }),
    prisma.brand.upsert({
      where: { name: 'Philips' },
      update: {},
      create: {
        name: 'Philips',
        description: '飞利浦家电与个护产品',
        logo: 'https://dummyimage.com/80x80/1d4ed8/fff&text=P',
      },
    }),
  ]);

  console.log('创建品牌完成:', brands.length, '个');

  return {
    parentCategories,
    childCategories,
    brands,
  };
}

async function seedBanners() {
  const banners = [
    {
      title: '开学季数码优惠',
      imageUrl:
        'https://dummyimage.com/1200x400/4f46e5/ffffff&text=%E5%BC%80%E5%AD%A6%E5%AD%A3%E6%95%B0%E7%A0%81%E4%BC%98%E6%83%A0',
      link: '/',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: '居家好物专场',
      imageUrl:
        'https://dummyimage.com/1200x400/f97316/ffffff&text=%E5%B1%85%E5%AE%B6%E5%A5%BD%E7%89%A9',
      link: '/',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: '美妆个护限时折扣',
      imageUrl:
        'https://dummyimage.com/1200x400/db2777/ffffff&text=%E7%BE%8E%E5%A6%86%E4%B8%93%E5%9C%BA',
      link: '/',
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const [index, banner] of banners.entries()) {
    await prisma.banner.create({
      data: {
        ...banner,
        sortOrder: index + 1,
      },
    });
  }

  console.log('创建 Banner 完成:', banners.length, '个');
}

async function seedStorages() {
  const storages: any[] = [];

  const local = await prisma.storage.create({
    data: {
      name: '本地存储',
      type: 'local',
      endpoint: 'http://localhost:3000',
      accessKey: 'local-access-key',
      secretKey: 'local-secret-key',
    },
  });

  storages.push(local);

  console.log('创建存储配置完成:', storages.length, '个');

  return storages;
}

async function seedProducts(opts: {
  childCategories: any[];
  brands: any[];
  storages: any[];
}) {
  const { childCategories, brands } = opts;

  if (childCategories.length === 0 || brands.length === 0) {
    console.warn('分类或品牌为空，跳过商品种子数据');
    return;
  }

  const productsData = [
    {
      title: 'Apple iPhone 15 Pro 128G',
      description: 'A17 Pro 芯片，钛金属机身，全新升级影像系统。',
      originalPrice: 8999,
      discountPrice: 7999,
      link: 'https://www.apple.com',
      isHidden: false,
      platform: 'JD',
      keywords: 'iphone,苹果手机,5G',
      sortOrder: 1,
      isTop: true,
      brandName: 'Apple',
      categoryName: '手机',
    },
    {
      title: '小米 14 Pro 5G',
      description: '徕卡影像，小米澎湃芯片，性价比旗舰手机。',
      originalPrice: 4999,
      discountPrice: 4299,
      link: 'https://www.mi.com',
      isHidden: false,
      platform: 'JD',
      keywords: '小米,安卓,5G',
      sortOrder: 2,
      isTop: true,
      brandName: 'Xiaomi',
      categoryName: '手机',
    },
    {
      title: '索尼 WH-1000XM5 降噪耳机',
      description: '行业领先的降噪与音质，舒适佩戴体验。',
      originalPrice: 2999,
      discountPrice: 2399,
      link: 'https://www.sony.com',
      isHidden: false,
      platform: 'JD',
      keywords: '索尼,耳机,降噪',
      sortOrder: 3,
      isTop: false,
      brandName: 'Sony',
      categoryName: '电脑办公',
    },
    {
      title: '飞利浦空气炸锅 XXL',
      description: '少油健康煎炸，居家必备厨房神器。',
      originalPrice: 1299,
      discountPrice: 899,
      link: 'https://www.philips.com',
      isHidden: false,
      platform: 'JD',
      keywords: '空气炸锅,厨房小家电',
      sortOrder: 4,
      isTop: false,
      brandName: 'Philips',
      categoryName: '厨房用品',
    },
  ];

  for (const p of productsData) {
    const brand = brands.find((b) => b.name === p.brandName);
    const category = childCategories.find((c) => c.name === p.categoryName);

    if (!brand || !category) continue;

    await prisma.product.create({
      data: {
        title: p.title,
        description: p.description,
        originalPrice: p.originalPrice,
        discountPrice: p.discountPrice,
        link: p.link,
        isHidden: p.isHidden,
        platform: p.platform,
        keywords: p.keywords,
        sortOrder: p.sortOrder,
        isTop: p.isTop,
        brandId: brand.id,
        categoryId: category.id,
      },
    });
  }

  console.log('创建商品完成:', productsData.length, '个');
}

async function main() {
  console.log('开始种子数据...');

  const { admin, adminRole } = await seedAdminAndPermissions();
  await seedSiteConfigs();
  const { parentCategories, childCategories, brands } =
    await seedCategoriesAndBrands();
  const storages = await seedStorages();
  await seedBanners();
  await seedProducts({ childCategories, brands, storages });

  console.log('种子数据完成！');
  console.log('管理员账号: admin@example.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
