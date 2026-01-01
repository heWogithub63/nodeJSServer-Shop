
import express from 'express';
import { Readable } from 'stream';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import { MongoClient, GridFSBucket } from 'mongodb';

const port =  process.env.PORT || 3030;
const app = express();
const uri = "mongodb+srv://wh:admin01@cluster0.kmwrpfb.mongodb.net/?retryWrites=true&w=majority";

var collection;

var database;
var obj;
var arrk,arrv;
var response;
var request;
var resent;
var reqUrl;
var trans;




// We are using our packages here
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '35mb',
    parameterLimit: 50000,
  }),
);

// to support JSON-encoded bodies
app.use(bodyParser.json({limit: '35mb'}));

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Start your server on a specified port
app.listen(port, ()=>{
    console.log(`Server is runing on port ${port}`)
})

// Add a basic route to check if server's up
app.get('/Shop', (req, res) => {
  res.status(200).send(`Server up and running`);
});

//Route that handles medOrganiser logic
app.post('/Shop',async (req, res) =>{

    const data = req.body;

    if(data != null) {
        response = res;
        request = req;
        obj = data;

        //console.log("-->"+JSON.stringify(obj));

	    requestPostString().catch(console.error);
	}

})




async function requestPostString() {


        try {
                await MongoClient
                        .connect(uri, {
                            maxPoolSize: 50,
                            wtimeoutMS: 2500,
                        })
                        .then((client) => {
                            console.log("connection established successfully");
                            database = client.db(obj.Database);
                            const collection = database.collection(obj.Collection);
                            read_write_to_collection(collection);
                        })
                        .catch(error => {
                             console.log("connection established not successfully");
                        })

                    
        } catch (e) {
		   console.error(e);
        } finally {
                   try {
                        await client.close();
                   } catch (e) {}
        }

}


async function read_write_to_collection (collection) {

      if(obj.CalledBy == 'BookInput') {
            delete obj.CalledBy;
            delete obj.Database;
            delete obj.Collection;
            await collection
                      .insertOne(obj)
                      .then(data => {
                           dataReturn('BookInput was successful');
                      })
                      .catch(error => {
                          dataReturn('BookInput was not successful');
                      })
      } else if(obj.CalledBy == 'BookOutput') {
            delete obj.CalledBy;
            delete obj.Database;
            delete obj.Collection;

            var success = await collection
                                  .deleteOne(obj)
                                  .catch((e) => {dataReturn('The Delete was not successful')});

            if(success.deletedCount == '1')
               dataReturn('The Delete was successful');
            else if(success.deletedCount == '1')
               dataReturn('The Delete was not successful Input DataControl');
            else
               dataReturn('The Delete was not successful');

      } else if(obj.CalledBy == 'RequestBooks') {
            var n = 0;
            var collector = new Array();
            var topic = obj.Collection.substring(obj.Collection.indexOf('_')+1);
            var author = obj.Author;

            if(author !== 'All Authors') {
                var resultArr =  await collection
                                      .find({$and:[{Topic: topic}, {Author: author}]}).toArray();
                    await resultArr.forEach( data => {
                            delete data._id;
                            collector[n] = data;
                            n++;
                    });
            } else {
                var resultArr =  await collection
                                  .find({}).toArray();
                await resultArr.forEach( data => {
                        delete data._id;
                        collector[n] = data;
                        n++;
                });

            }

                dataReturn(collector);

      } else if(obj.CalledBy == 'RequestAuthors') {

           await collection
                           .distinct('Author')
                           .then (data =>{
                                dataReturn(data);
                           })

      }
}

async function dataReturn (trans) {
            //console.dir('---'+JSON.stringify(trans)+'....');
            await response.status(200).json({body: JSON.stringify(trans, (key, value) =>
              typeof value === "bigint" ? Number(value) : value
            )});

      }
