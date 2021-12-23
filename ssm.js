const {SSMClient, GetParametersByPathCommand, GetParameterCommand} = require("@aws-sdk/client-ssm");
const client = new SSMClient({region: process.env.AWS_REGION ?? "us-east-1"});

const getParametersByPath = async (path) => {
    const params = {
        Path: path,
        Recursive: true,
        WithDecryption: true
    };
    const data = await client.send(new GetParametersByPathCommand(params));
    return data.Parameters;
};

const getParameter = async (name) => {
    const params = {
        Name: name,
        WithDecryption: true
    };
    const data = await client.send(new GetParameterCommand(params));
    return data.Parameter;
};


const pathToDict = ({prev, value, path}) => {
    let prevObj = prev
    path.split("/").forEach((key, index, names) => {
        if (index === 0 && key === "") {
            return
        }
        if (index === names.length - 1) {
            prevObj[key] = value;
        } else {
            if (key in prevObj) {
                prevObj = prevObj[key];
            } else {
                prevObj[key] = {};
                prevObj = prevObj[key];
            }
        }
    })
    return prev
}

exports.getSsmParameters = async ({paths, items}) => {
    let parameters = {}
    for (const path of paths) {
        const params = await getParametersByPath(path);

        params.reduce((prev, param) => {
            const {Name, Value} = param;
            return pathToDict({prev, value: Value, path: Name});
        }, parameters);
    }

    for (const item of items) {
        const param = await getParameter(item);
        const {Name, Value} = param;
        parameters = pathToDict({prev: parameters, value: Value, path: Name});
    }
    return parameters
};