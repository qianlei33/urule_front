/**
 * Created by Jacky.Gao on 2018-04-23.
 * Base on Webpack4
 */
const path=require('path');
const webpack=require('webpack');
const copyWebpackPlugin = require('copy-webpack-plugin');

const htmlWebpackPlugin = require("html-webpack-plugin");// html模板


const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});

// const CleanWebpackPlugin  = require("clean-webpack-plugin")// 清空上次打包内容


const entryConfig={
    'frame':{'filename':'frame','title':'frame','template':'./public/html/frame.html','chunks':['frame']},
    'variableeditor':{'filename':'variableeditor','title':'frame','template':'./public/html/frame.html','chunks':['variableEditor']},
    'constanteditor':{'filename':'constanteditor','title':'frame','template':'./public/html/frame.html','chunks':['constantEditor']},
    'parametereditor':{'filename':'parametereditor','title':'frame','template':'./public/html/frame.html','chunks':['parameterEditor']},
    'actioneditor':{'filename':'actioneditor','title':'frame','template':'./public/html/frame.html','chunks':['actionEditor']},
    'packageeditor':{'filename':'packageeditor','title':'frame','template':'./public/html/frame.html','chunks':['packageEditor']},
    'ruleflowdesigner':{'filename':'ruleflowdesigner','title':'决策流设计器','template':'./public/html/frame.html','chunks':['flowDesigner']},
    'ruleseteditor':{'filename':'ruleseteditor','title':'决策集编辑器','template':'./public/html/rule-editor.html','chunks':['ruleSetEditor']},
    'decisiontableeditor':{'filename':'decisiontableeditor','title':'决策表编辑器','template':'./public/html/project-editor.html','chunks':['decisionTableEditor']},
    'decisiontreeeditor':{'filename':'decisiontreeeditor','title':'决策树编辑器','template':'./public/html/project-editor.html','chunks':['decisionTreeEditor']},
    'scriptdecisiontableeditor':{'filename':'scriptdecisiontableeditor','title':'frame','template':'./public/html/frame.html','chunks':['scriptDecisionTableEditor']},
    'uleditor':{'filename':'uleditor','title':'frame','template':'./public/html/frame.html','chunks':['ulEditor']},
    'scorecardeditor':{'filename':'scorecardeditor','title':'评分卡编辑器','template':'./public/html/project-table.html','chunks':['scoreCardTable']},
    'permissionconfigeditor':{'filename':'permissionconfigeditor','title':'frame','template':'./public/html/frame.html','chunks':['permissionConfigEditor']},
};

const htmlWebpackPluginArr=[];
for(let key in entryConfig){
    let obj=entryConfig[key];
    let config={
        title:obj.title,
        filename:obj.filename,
        template:obj.template,
        chunks:obj.chunks
    };
    htmlWebpackPluginArr.push(new htmlWebpackPlugin(config));
}
            

module.exports={
    stats: {
        children: false
    },
    mode:'development',
    entry: {
        frame:'./src/frame/index.jsx',
        variableEditor:'./src/variable/index.jsx',
        constantEditor:'./src/constant/index.jsx',
        parameterEditor:'./src/parameter/index.jsx',
        actionEditor:'./src/action/index.jsx',
        packageEditor:'./src/package/index.jsx',
        flowDesigner:'./src/flow/index.jsx',
        ruleSetEditor:'./src/editor/urule/index.jsx',
        decisionTableEditor:'./src/editor/decisiontable/index.jsx',
        scriptDecisionTableEditor:'./src/editor/scriptdecisiontable/index.jsx',
        decisionTreeEditor:'./src/editor/decisiontree/index.jsx',
        // clientConfigEditor:'./src/client/index.jsx',
        ulEditor:'./src/editor/ul/index.jsx',
        scoreCardTable:'./src/scorecard/index.jsx',
        permissionConfigEditor:'./src/permission/index.jsx'
    },
    output:{
        // path:path.resolve('../urule-console/src/main/resources/urule-asserts/js'),
        path : path.resolve('dist'),
        filename:'[name].bundle.js',
        // publicPath: "/frame" 
    },
    

    resolve: {
        /* 配置路径别名,优点:简写路径;缺点:没有提示 */
        alias: {
            $css: path.resolve(__dirname, "src/css")
        },
        /* 配置省略文件后缀名 */
        extensions: [".js", ".json", ".css", "jsx"],
        /* 告诉 webpack 解析模块去哪个目录找 */
        modules: [path.resolve(__dirname, "../../node_modules"), "node_modules"]
    },

    plugins: [
        // new htmlWebpackPlugin({
        //     title : '1111'
        // }),// 使用生成html模板的插件
        // new CleanWebpackPlugin(),// 使用打包后删除上一次打包文件的插件
        
        new webpack.ProvidePlugin({ 
            // $: "jquery" ,
            // jQuery: "jquery",
            // // bootbox: "bootbox",
            // bootstrapValidator: "bootstrapvalidator",
            // Bootstrap: "bootstrap"
        }),
        // new htmlWebpackPlugin({
        //     title : 'URule Console',
        //     filename: 'frame',
        //     template: './public/html/frame.html',
        //     chunks: ['frame']
        // }),

        ...htmlWebpackPluginArr,
        
        new copyWebpackPlugin([
            { from: './public/css/', to: './dist/css/' },
            { from: './public/fonts/', to: './dist/fonts/' },
            { from: './public/venderjs/', to: './dist/venderjs/' },
        ])

    ],

    module:{
        rules:[
            {
                test: /\.(jsx|js)?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options:{
                    "presets": [
                        "react","env"
                    ]
                }
            },
            {
                test:/\.css$/,
                use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
            },
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10000000
                        }
                    }
                ]
            }
        ]
    },

    devServer: {
        historyApiFallback: true,
        /* 运行代码的目录 */
        contentBase: path.resolve(__dirname, "dist"),
        /* 监视 contentBase 目录下的所有文件,一旦文件发生变化就会 reload (重载+刷新浏览器)*/
        watchContentBase: true,
        /* 监视文件时 配合 watchContentBase */
        watchOptions: {
            /* 忽略掉的文件(不参与监视的文件) */
            ignored: /node_modules/
        },
        /* 启动gzip压缩 */
        compress: true,
        /* 运行服务时自动打开服务器 */
        open: false,
        /* 启动HMR热更新 */
        hot: true,
        /* 启动的端口号 */
        port: 5000,
        /* 启动的IP地址或域名 */
        host: "localhost",
        /* 关闭服务器启动日志 */
        clientLogLevel: "debug",
        /* 除了一些启动的基本信息,其他内容都不要打印 */
        quiet: false,
        /* 如果出错不要全屏提示 */
        overlay: false,
        /* 服务器代理 --> 解决开发环境跨域问题 */
        before: function(app, server) {

            app.use('/api/urule', function(req, res) {
                if (req.method === 'POST' || 
                    (req.method === 'GET' && req.url.indexOf('/common/loadFunctions') > -1) ||
                    (req.method === 'GET' && req.url.indexOf('/ruleflowdesigner/loadFlowDefinition') > -1) 
                
                ){
                    // 为POST请求设置不同的目标路径
                    proxy.web(req, res, { target: 'http://127.0.0.1:8009/ebu-rule-server/urule/'});
                } else {
                    // 为其他请求使用默认目标路径
                    proxy.web(req, res, { target: 'http://127.0.0.1:5000/' });
                }
            });
            
        },


    }

};