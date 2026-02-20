import { defineConfig } from "@umijs/max";

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: "返利折扣网管理后台",
  },
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/login",
      component: "./Login",
      layout: false,
    },
    {
      path: "/dashboard",
      component: "./Dashboard",
    },
    {
      path: "/products",
      name: "商品管理",
      routes: [
        {
          path: "/products",
          redirect: "/products/list",
        },
        {
          path: "/products/list",
          component: "./Products/List",
        },
        {
          path: "/products/create",
          component: "./Products/Create",
        },
        {
          path: "/products/edit/:id",
          component: "./Products/Edit",
        },
      ],
    },
    {
      path: "/brands",
      name: "品牌管理",
      component: "./Brands",
    },
    {
      path: "/categories",
      name: "分类管理",
      component: "./Categories",
    },
    {
      path: "/users",
      name: "用户管理",
      component: "./Users",
    },
    {
      path: "/roles",
      name: "角色管理",
      component: "./Roles",
    },
    {
      path: "/permissions",
      name: "权限管理",
      component: "./Permissions",
    },
    {
      path: "/orders",
      name: "订单管理",
      component: "./Orders",
    },
    {
      path: "/banners",
      name: "Banner管理",
      component: "./Banners",
    },
    {
      path: "/storages",
      name: "存储管理",
      component: "./Storages",
    },
    {
      path: "/configs",
      name: "网站配置",
      component: "./Configs",
    },
  ],
  npmClient: "npm",
});
