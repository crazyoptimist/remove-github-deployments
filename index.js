import 'dotenv/config'
import fetch from "node-fetch"

const URL = `https://api.github.com/repos/${process.env.USER_OR_ORG}/${process.env.REPO}/deployments`;
const AUTH_HEADER = `token ${process.env.TOKEN}`;

const getAllDeployments = () =>
  fetch(`${URL}`, {
    headers: {
      authorization: AUTH_HEADER
    }
  }).then(val => val.json());

const makeDeploymentInactive = id =>
  fetch(`${URL}/${id}/statuses`, {
    method: "POST",
    body: JSON.stringify({
      state: "inactive"
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github.ant-man-preview+json",
      authorization: AUTH_HEADER
    }
  }).then(() => id);

const deleteDeployment = id =>
  fetch(`${URL}/${id}`, {
    method: "DELETE",
    headers: {
      authorization: AUTH_HEADER
    }
  }).then(() => id);

const runBatch = async () => {
  const batchResult = await getAllDeployments()
    .catch(console.error)
    .then(res => {
      console.log(`${res.length} deployments found`);
      return res;
    })
    .then(val => val.map(({
      id
    }) => id))
    .then(ids => Promise.all(ids.map(id => makeDeploymentInactive(id))))
    .then(res => {
      console.log(`${res.length} deployments marked as "inactive"`);
      return res;
    })
    .then(ids => Promise.all(ids.map(id => deleteDeployment(id))))
    .then(res => {
      console.log(`${res.length} deployments deleted`);
      return res;
    })

  return batchResult;
}

const removeEnvironments = async () => {
  while(1) {
    const batchResult = await runBatch()
    if (!Array.isArray(batchResult) || batchResult.length === 0) break;
  }
}

removeEnvironments()
