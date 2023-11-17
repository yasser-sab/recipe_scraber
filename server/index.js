const { default: axios } = require("axios");
const fs = require('fs');
const cheerio = require("cheerio");
const { parse } = require("path");
// const { data } = require("cheerio/lib/api/attributes");

async function getRecipe(uri,cat){
const forbiden = ['pork','ham','cocktail','cocktails','Champagne','vodka'];
try{
    axios(uri,{"CSRFToken": "bd137caa325ab6c818d51a4528370773"}
        ,{
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded",
                "pragma": "no-cache",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "cookie":"TMog=n1bbe2ba5b212499e8b79540bcaf5165516; globalTI_SID=9f514da9-5793-4fdc-9cf2-be13fabcfbee; lb_ld=search; _pbjs_userid_consent_data=3524755945110770; Mint=nd093ad73b5c34644b4156e0dbce6f10515; pc=1"
              },
        }).then(response=>response.data)
        .then(body=>{
            const $ = cheerio.load(body);
            const result = JSON.parse($('script#schema-lifestyle_1-0').text());
            const instructions=[];
            let danger=false;

            forbiden.map((item,ind)=>{
                danger=result['recipeIngredient'].join("").toLowerCase().indexOf(item)!=-1;
            });

            if(!danger && result['video']){

                let im=false;

                result['recipeInstructions'].map((item,i)=>{
                    if(item.hasOwnProperty('text')){
                        if(item.hasOwnProperty('image')){
                            instructions.push({img:item['image']['url'],text:item['text']});
                        }else{
                            im=true;
                            return;
                            // instructions.push({img:'',text:item['text']});
                        }
                    }else{
                        const sub=[];
                        item['itemListElement'].map((item2,i)=>{
                            if(item2.hasOwnProperty('image')){
                                sub.push({img:item2['image']['url'],text:item2['text']});
                            }else{
                                im=true;
                                return;
                                // sub.push({img:'',text:item2['text']});
                            }
                        });
                        instructions.push({
                            title:item['name'],
                            content:sub
                        });

                    }

                });
                if(!im){

                    const recipe={
                        title:result['headline'],
                        description:result["description"],
                        img:typeof(result['image'])=="Object" && result['image']["url"]?result['image']:result['image'][result['image'].length-1]["url"],
                        video:result['video']?((!Array.isArray(result['video'])) ?result['video']:result['video'][result['video'].length-1]):"",
                        preptime:formatTime(result['prepTime']),
                        cooktime:formatTime(result['cookTime']),
                        totaltime:formatTime(result['totalTime']),
                        servings:typeof(result['recipeYield'])=="string"?result['recipeYield']:result['recipeYield'][0],
                        nutrition:result['nutrition'],
                        ingredient:result['recipeIngredient'],
                        instructions:instructions,
                        keywords:result['keywords']
                    }

                    fs.appendFile("test.json",","+JSON.stringify(recipe),err=>{
                        if(err){
                            console.error(err);
                            return;
                        }
                    });
                }


            }
        });
}
catch{
     console.log("error => => => => => => => => ");
 }
}

async function getCategorie(cat){
    const URI='https://www.thespruceeats.com/facetedsearch';
    let offset=0,limit=24;
    let numReci=1;
    let response;
    let body;
    let recipes;
    let cmp=0;

    while(offset<numReci){
        cmp++;
        try {
            await axios.post(URI,
                {"query":cat,"offset":offset,"limit":limit,"facetSearchKey":"recipe","maxHeight":300,"maxWidth":425,"forceSize":false,"cropSetting":"","pivots":{},"CSRFToken":"91a645fa49fbded332bca65ab162ea62"},
                {
                    headers:{
                        "accept": "image/webp, */*",
                        "accept-language": "en-US,en;q=0.9",
                        "cache-control": "no-cache",
                        "content-type": "application/json",
                        "pragma": "no-cache",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "sec-gpc": "1",
                        "x-requested-with": "XMLHttpRequest",
                        "Cookie":"TMog=n1bbe2ba5b212499e8b79540bcaf5165516; globalTI_SID=9f514da9-5793-4fdc-9cf2-be13fabcfbee; lb_ld=search; _pbjs_userid_consent_data=3524755945110770; Mint=n113d1df2fa8e4fd8aff5a3be1af8ca1316; pc=3",
                        "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
                    }
                }
            ).then((response)=>response.data)
            .then((body)=>{
                recipes = body.wrappedItems;
                numReci = Number(body.numFound);

                console.log(cmp);

                recipes.map((item,i)=>{
                    getRecipe(item.url);
                });

                if((offset+limit)>=numReci){
                    offset+=(numReci-offset);
                }else{
                    offset+=limit;
                }
            });
        }catch{
            console.error("error");
        }
    }

}
// getCategorie("coffee");

function formatTime(str){
    let time = Number(str.match(/(\d+)/)[0]);
    const hours = parseInt((time/60));
    const minutes = parseInt(time-hours*60);
    if(hours==0){
        return minutes+" min";
    }else if(minutes==0){
        return hours +" hr";
    }
    return hours +" hr "+minutes+" min";
}
// 1445 recipe

function test(){
    let cmp=0;
    fs.readFile('recipe.json',{encoding:"utf-8"},(err,data)=>{
        const table=JSON.parse(data);
        table.map((item,i)=>{
            cmp+=item['recipe'].length;
        });
        console.log(cmp);
        // console.log(table[table.length-1]["recipe"][0]["instructions"][0]["title"]);
    });
}
// test();







//  try {

//     await axios.get(uri)
//     .then((response)=>response.data)
//     .then(body=>{
//         const $ = cheerio.load(body);
//         const recipe={};

//     recipe['title']=$('h1.heading__title').text().trim();
//     recipe['img']=$('#primary-media_1-0 img').attr('src');
//     recipe["prep"]=$('#project-meta_1-0 .prep-time .meta-text__data').text().trim();
//     recipe["cook"]=$('#project-meta_1-0 .cook-time .meta-text__data').text().trim();
//     recipe["total"]=$('#project-meta_1-0 .total-time .meta-text__data').text().trim();
//     recipe["servings"]=$('#project-meta_1-0 .recipe-serving .meta-text__data').text().trim();

//     $('#nutrition-info_1-0 .nutrition-info__table tbody').each((i,item)=>{
//         $(item).find('tr').each((ind,val)=>{
//             recipe[$(val).find('td').last().text()]=$(val).find('td').first().text().trim();
//         });
//     });


//     recipe["desc"]=$("#mntl-sc-block_1-0").text().trim();

//     const ingredients = [];
//     $(".structured-ingredients__list-item").each((i,item)=>{
//         // let res={};

//         // if($(item).find("span").length==2){
//         //     ingredients.push({
//         //         quantity:$(item).find("span").first().text(),
//         //         name:$(item).find("span").last().text()
//         //     });
//         // }else if($(item).find("span").length==3){
//         //     ingredients.push({
//         //         quantity:$(item).find("span").first().text(),
//         //         unit:$(item).find("span:nth-child(2)").text(),
//         //         name:$(item).find("span").last().text()
//         //     });
//         // }else{
//         //     ingredients.push({
//         //         name:$(item).find("span").last().text()
//         //     });
//         // }
//         ingredients.push($(item).text().trim());

//     });
//     recipe["ingredients"]=ingredients;

//     const directions=[];

//     $('#section--instructions_1-0 #mntl-sc-block_3-0 li').each((i,item)=>{
//         if($(item).find('img').length>0){
//             directions.push({
//                 content:$(item).find("p").text().trim(),
//                 img:$(item).find('img').attr('data-src')
//             });
//         }else{
//             directions.push({
//                 content:$(item).find("p").text().trim()
//             });
//         }
//     });

//     recipe["directions"]=directions;

//         // fs.appendFile("recipe.json",JSON.stringify(table),err=>{
//         //     if(err){
//         //         console.error(err);
//         //         return;
//         //     }
//         // });

//         if(recipe['title']=="" ||recipe['img']==""||recipe["prep"]==""||recipe["cook"]==""||recipe["total"]==""||recipe["servings"]==""||ingredients.length==0||directions.length==0||recipe["desc"]==""){
//             fs.appendFile("recipe.json",","+JSON.stringify(recipe),err=>{
//                     if(err){
//                         console.error(err);
//                         return;
//                     }
//                 });
//         }else{
//             console.log(recipe.title);
//         }
//     });

//  }