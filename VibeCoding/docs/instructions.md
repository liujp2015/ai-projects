你现在是一位资深的DevOps工程师，专精于Node.js/NestJS应用的容器化。

请为我们的backend项目，编写一个Dockerfile。如果Dockerfile已存在，请审查并重写我们项目现有的Dockerfile。

必须遵循以下生产级最佳实践：

多阶段构建 (Multi-stage Build):

使用一个包含完整Node.js工具链的builder阶段来安装依赖并构建TypeScript代码（生成dist目录）。

使用一个极度精简的alpine或distroless镜像作为最终的final阶段，只拷贝构建产物（dist）和生产依赖（node_modules），以实现最小化的镜像体积。

依赖缓存: 优化npm install或yarn install相关指令的顺序，确保依赖层能够被Docker有效缓存，加速后续构建。

安全性:

在最终阶段，使用一个非root用户来运行应用（例如Node镜像自带的node用户）。

确保最终镜像不包含任何源代码（Type文件）或构建工具（如typescript、webpack等），仅保留运行所需的JavaScript文件和必要依赖。

请分析我们项目的结构（@backend），特别是src/main.ts入口文件以及package.json的构建脚本，然后生成这份优化后的Dockerfile，并覆盖写入。