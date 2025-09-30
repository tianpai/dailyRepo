import { TrendingDeveloper } from "@model/TrendingDeveloper";
import { connectToDatabase } from "@/services/db-connection";

function mergeDeveloperDocs(docs) {
  const first = docs[0];
  const allDates = docs.map((doc) => doc.trendingDate);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...merged } = { ...first, trendingRecord: allDates };
  return merged;
}

function extractDocIds(docs) {
  return docs.map((doc) => doc._id);
}

async function deleteDocsById(ids) {
  return await TrendingDeveloper.deleteMany({ _id: { $in: ids } });
}

async function saveMergedDoc(mergedDoc) {
  return await TrendingDeveloper.create(mergedDoc);
}

async function main() {
  await connectToDatabase();

  if (process.argv.includes("--rm-trendingdate")) {
    const result = await TrendingDeveloper.updateMany(
      {},
      { $unset: { trendingDate: "" } },
    );
    console.log(`Removed trendingDate field from ${result.modifiedCount} docs`);
    process.exit(0);
  }

  const unique_devs = await TrendingDeveloper.distinct("username");
  const all_devs = await TrendingDeveloper.countDocuments();
  console.log("unique devs: ", unique_devs.length);
  console.log("total devs: ", all_devs);

  if (unique_devs.length === all_devs) {
    console.log("Migration already complete - no duplicates found");
    process.exit(0);
  }

  for (let i = 0; i < unique_devs.length; i++) {
    const dev_username = unique_devs[i];
    const docs = await TrendingDeveloper.find({
      username: dev_username,
    }).lean();
    console.log(dev_username, docs.length);

    const merged = mergeDeveloperDocs(docs);
    const death_row = extractDocIds(docs);

    await deleteDocsById(death_row);
    await saveMergedDoc(merged);
  }
  process.exit(0);
}

main().catch(console.error);
