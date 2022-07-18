'use strict';

/**
 *  asset controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
    constants: { PUBLISHED_AT_ATTRIBUTE },
} = require('@strapi/utils').contentTypes;
const { propOr } = require('lodash/fp');

const setPublishedAt = data => {
    data[PUBLISHED_AT_ATTRIBUTE] = propOr(new Date(), PUBLISHED_AT_ATTRIBUTE, data);
};

const clearPublishedAt = data => {
    data[PUBLISHED_AT_ATTRIBUTE] = null;
};

const filterProps = (allowed, raw) => {
    return Object.keys(raw)
        .filter(key => allowed.includes(key))
        .reduce((obj, key) => {
            obj[key] = raw[key];
            return obj;
        }, {});

}

module.exports = createCoreController('api::asset.asset',
    ({ strapi }) => ({

        async findOne(ctx) {
            const { id : uniqueId } = ctx.params;
            const { query } = ctx;

            const entities = await strapi.entityService.findMany('api::asset.asset', {
                filters: {
                    $and: [
                        {
                            uniqueId,
                        },
                    ]
                },
                sort: { id: 'desc' },
                limit: 1,
            });

            const entity = entities ? entities[0] : undefined;
            

            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        
            return this.transformResponse(sanitizedEntity);
          },
        

        async create(ctx) {
            const allowed = ['uniqueId', 'title', 'imageAddress', 'description', 'assetType'];
            const data = filterProps(allowed, ctx.request.body.data);
            const entity = await strapi.entityService.create('api::asset.asset', {
                data
            });

            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

            return this.transformResponse(sanitizedEntity);
        },

        async update(ctx) {
            const allowed = ['id', 'title', 'description', 'transactionAddress', 'issuerAddress', 'ownerAddress', 'imageAddress', 'state', 'draft'];
            ctx.request.body.data = filterProps(allowed, ctx.request.body.data);
            const { draft } = ctx.request.body.data;
            if (!draft) {
                setPublishedAt(ctx.request.body.data);
            }
            else {
                clearPublishedAt(ctx.request.body.data);
            }


            const response = await super.update(ctx);
            if (!draft) {
                const { id, attributes } = response.data;
                const { transactionAddress, issuerAddress, ownerAddress, imageAddress } = attributes;

                const lastTransactionHistory = await strapi.entityService.findMany('api::asset-transaction.asset-transaction', {
                    populate: ["asset"], 
                    filters: {
                        $and: [
                            {
                              asset: id,
                            },
                        ]
                    },
                    sort: { id: 'desc' },
                    limit: 1,
                });

                let txid = null;
                if (lastTransactionHistory && lastTransactionHistory[0] && lastTransactionHistory[0].id) {
                    txid = lastTransactionHistory[0].id;

                }

                const transactionHistoryData = {
                    transactionAddress,
                    issuerAddress,
                    ownerAddress,
                    imageAddress,
                    asset: id,
                    previousAssetTransaction: txid,
                };
                setPublishedAt(transactionHistoryData);

                await strapi.entityService.create('api::asset-transaction.asset-transaction', {
                    data: transactionHistoryData
                });
            }
            return response;

        }
    }));
