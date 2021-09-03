import React, { useEffect, useState } from 'react'
import { Form, Grid } from 'semantic-ui-react'

import { useSubstrate } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

import KittyCards from './KittyCards'

export default function Kitties (props) {
  const { api, keyring } = useSubstrate()
  const { accountPair } = props

  const [kitties, setKitties] = useState([])
  const [status, setStatus] = useState('')
  //Kitty数量
  const [kittiesNumber, setKittiesNumber] = useState(0)  
  //Kitty主人
  const [kittiesOwner, setKittyOwner] = useState([])
  //Kitty DNA
  const [kittiesDNA, setKittiesDNA] = useState([])
 
  const fetchKittyNumber = () => {
    api.query.kittiesModule.kittiesCount(
      res => {
        setKittiesNumber(res.isNone ? 0 :res.unwrap().toNumber());
      }
    );
  }
  
  const fetchKitties = () => {
    // TODO: 在这里调用 `api.query.kittiesModule.*` 函数去取得猫咪的信息。
    // 你需要取得：
    //   - 共有多少只猫咪
    //   - 每只猫咪的主人是谁
    //   - 每只猫咪的 DNA 是什么，用来组合出它的形态
    let unsubKitty = null;
    let unsubOwner = null;
    const asyncFetch = async() => {

        const kittiesIndex = [...Array(kittiesNumber).keys()];
        unsubKitty = await api.query.kittiesModule.kitties.multi(
          kittiesIndex, 
          kitties => {
            //toU8a() -> returns a Uint8Array representation of the encoded value 
            setKittiesDNA(kitties.map((dna) => (dna.isNone ? {} : dna.unwrap().toU8a())));
          }
        );

        unsubOwner = await api.query.kittiesModule.owner.multi(
          kittiesIndex,
          owners => {
            setKittyOwner(owners.map(owner => owner.unwrap().toJSON()));
            //console.log(owners);
          }  
        );
      
    }

    asyncFetch();

    return () => {
      unsubKitty && unsubKitty();
      unsubOwner && unsubOwner();
    }
   
  }

  const populateKitties = () => {
    // TODO: 在这里添加额外的逻辑。你需要组成这样的数组结构：
    //  ```javascript
    //  const kitties = [{
    //    id: 0,
    //    dna: ...,
    //    owner: ...
    //  }, { id: ..., dna: ..., owner: ... }]
    //  ```
    // 这个 kitties 会传入 <KittyCards/> 然后对每只猫咪进行处理
    setKitties(kittiesDNA.map((dna, index) => ({
       id:index, 
       dna, 
       owner: kittiesOwner[index] 
      })
    ))
     
  }

  useEffect(fetchKittyNumber, [api, keyring, status]);
  useEffect(fetchKitties, [api, keyring, status])
  useEffect(populateKitties, [kittiesDNA, kittiesOwner, status])

  return <Grid.Column width={16}>
    <h1>小毛孩</h1>
    <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus}/>
    <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={accountPair} label='创建小毛孩' type='SIGNED-TX' setStatus={setStatus}
          attrs={{
            palletRpc: 'kittiesModule',
            callable: 'create',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>
}
