import {message} from 'antd';
import URL from 'url';

const GenerateSchema = require('generate-schema/src/schemas/json.js');
import {json_parse} from '../../common/utils.js';

/**
 * 筛选接口列表和分类列表
 */
const filterItemAndFolder = (items) => {
    let folders = []
    let requests = []

    items.forEach((item) => {
        if (item.target_type == 'folder') {
            let childrens = filterRequests(item.name, item.children);
            requests = requests.concat(childrens)
            delete item.children
            delete item.request
            delete item.script
            folders.push(item)
        } else if (item.target_type == 'api') {
            requests.push(item)
        }
    })

    return {
        folders,
        requests
    }
}

/**
 * 筛选环境
 * @param items
 * @returns {[]}
 */
const filterEnvs = (items) => {
    let envs = []
    items.forEach((item) => {
        let domain = ''
        if(item.list){
            domain = item.list.host.value
        }
        envs.push({
            domain: domain,
            global: [],
            header: [],
            name: item.name
        })
    })

   return envs
}

/**
 * 递归获取请求
 * @param folderName
 * @param items
 * @returns {[]}
 */
const filterRequests = (folderName, items) => {
    let requests = [];
    items.forEach((item) => {
        if (item.target_type === 'folder') {
            if (item.children) {
                requests = requests.concat(filterRequests(item.name, item.children))
            }
        } else if (item.target_type === 'api') {
            item.folderName = folderName
            requests.push(item)
            if (item.children) {
                requests = requests.concat(filterRequests(folderName, item.children))
            }
        }
    })
    return requests;
}

function apipost(importDataModule) {
    function parseUrl(url) {
        return URL.parse(url);
    }

    function handleReq_query(querys) {
        let res = [];
        if (querys && querys.length) {
            querys.forEach(query => {
                res.push({
                    name: query.key,
                    desc: query.description || '',
                    value: query.value,
                    required: query.not_null == 1 ? '1': '0'
                });
            })
        }
        return res;
    }

    function handleReq_headers(headers) {
        let res = [];
        if (headers && headers.length) {
            headers.forEach(header => {
                res.push({
                    name: header.key,
                    desc: header.description || '',
                    value: header.value,
                    required: header.not_null == 1 ? '1': '0'
                });
            })
        }
        return res;
    }

    function handleReq_body_form(forms) {
        let res = [];
        if (forms && forms.length) {
            forms.forEach(form => {
                res.push({
                    name: form.key,
                    desc: form.description || '',
                    value: form.value,
                    required: form.not_null == 1 ? '1': '0'
                });
            })
        }
        return res;
    }


    function run(res) {
        try {
            res = JSON.parse(res);
            let interfaceData = { apis: [], cats: [], envs: [] };
            // 筛选接口和分类
            let {folders, requests} = filterItemAndFolder(res.targets)

            let envs = filterEnvs(res.project.envs)

            interfaceData.envs = interfaceData.envs.concat(envs);

            // 分类数据
            if (folders && Array.isArray(folders)) {
                folders.forEach((folder) => {
                    interfaceData.cats.push({
                        name: folder.name,
                        desc: folder.description || ''
                    })
                })
            }

            // 转换为需要的接口数据格式
            let list = []
            if (requests && requests.length) {
                requests.forEach(request => {
                    let data = importApiPost(request)
                    list.push(data)
                })
            }
            interfaceData.apis = interfaceData.apis.concat(list);
            return interfaceData;
        } catch (e) {
            console.log('e ', e)
            message.error('文件格式必须为JSON');
        }
    }

    function importApiPost(data) {
        let res = {};
        try {
            res.title = data.name
            res.path = data.request.url.replace('{{host}}', '')
            res.catname = data.folderName
            res.method = data.method
            res.desc = data.request.description || ''
            if (data.request.body.mode == 'form-data') {
                res.req_body_type = 'form'
            } else if (data.request.body.mode == 'json') {
                res.req_body_type = 'json'
            }
            res.req_query = handleReq_query.bind(this)(data.request.query.parameter);
            res.req_body_form = handleReq_body_form.bind(this)(data.request.query.parameter);
            res.req_headers = handleReq_headers.bind(this)(data.request.header.parameter);
        } catch (err) {
            console.log(err.message);
            message.error(`${err.message}, 导入的apipost格式有误`);
        }
        return res;
    }

    if (!importDataModule || typeof importDataModule !== 'object') {
        console.error('obj参数必需是一个对象');
        return null;
    }

    importDataModule.apipost = {
        name: 'ApiPost',
        run: run,
        desc: '注意：只支持json格式数据'
    };
}

module.exports = function () {
    this.bindHook('import_data', apipost);
};
