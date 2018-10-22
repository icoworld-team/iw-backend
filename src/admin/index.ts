import * as path from 'path';
import * as Router from 'koa-router';
import * as pug from 'pug';
import web3 from '../eth/util';
import Pool, { Status } from '../models/Pool';
import { deployContract } from '../eth/contracts';

const router = new Router();

function compileConfirmPage(message) {
  const fn = pug.compileFile(path.resolve(__dirname, '../', '../', 'templates', 'confirmPage.pug'));
  const params = { message };
  return fn(params);
}

async function changePoolStatus(poolId, status) {
  const updatedPool = await Pool.findByIdAndUpdate(poolId, { status }, { new: true }) as any;
  return updatedPool.status;
}

router.get('/admin/pools', async (ctx) => {
  const pools = await Pool
    .find()
    .sort('-createdAt');
  const fn = pug.compileFile(path.resolve(__dirname, '../', '../', 'templates', 'poolListPage.pug'));
  const params = { pools };
  ctx.body = fn(params);
});

router.get('/admin/pools/:id', async (ctx) => {
  const id = ctx.params.id;
  const pool = await Pool
    .findById(id)
    .populate({
      path: 'owner',
      select: 'name'
    });
  const fn = pug.compileFile(path.resolve(__dirname, '../', '../', 'templates', 'poolPage.pug'));
  const params = { pool };
  ctx.body = fn(params);
})

router.get('/admin/pools/:id/remove', async (ctx) => {
  const id = ctx.params.id;
  await changePoolStatus(id, Status.Removed);
  const message = 'Pool has been removed';
  ctx.body = compileConfirmPage(message);
})

router.get('/admin/pools/:id/block', async (ctx) => {
  const id = ctx.params.id;
  await changePoolStatus(id, Status.Blocked);
  const message = 'Pool has been blocked';
  ctx.body = compileConfirmPage(message);
})

router.get('/admin/pools/:id/hold', async (ctx) => {
  const id = ctx.params.id;
  await changePoolStatus(id, Status.OnHold);
  const message = 'Pool has been held';
  ctx.body = compileConfirmPage(message);
})

router.get('/admin/pools/:id/verify', async (ctx) => {
  const id = ctx.params.id;
  await changePoolStatus(id, Status.Verified);
  const message = 'Pool has been verified';
  ctx.body = compileConfirmPage(message);
})

router.get('/admin/pools/:id/deploy', async (ctx) => {
  const id = ctx.params.id;
  const pool = await Pool.findById(id) as any;
  await changePoolStatus(id, Status.Deploying);
  let error = undefined;
  
  try {
    const args = [
      pool.wallet.address,
      web3.toBigNumber(pool.sum_max),
      web3.toBigNumber(pool.sum_min),
      web3.toBigNumber(pool.sum_mbr_max),
      web3.toBigNumber(pool.sum_mbr_min),
      pool.comission,
      pool.lead_comission,
      pool.comissionPaymentAddress,
      Number(new Date()), // start
      Number(new Date()), // period
      Number(pool.endDate)
    ];
    const data = await deployContract(pool.contract, args);
    pool.deploy = { abi: data.abi, address: data.address };
    try {
      await pool.save();
    } catch(err) {
      console.log(`Error saving contract data for Pool: ${pool.poolName}`);
    }
  } catch (err) {
    error = err;
  }
  await changePoolStatus(id, (error) ? Status.DeployFailed : Status.Deployed);
  ctx.body = compileConfirmPage((error) ? `Error deployig pool contract: ${error}` : 'Pool has been deployed');
})

export default router.routes();
