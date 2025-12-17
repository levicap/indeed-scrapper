import { scrapeJobs } from 'ts-jobspy';
import fs from 'fs/promises';

async function main() {
    console.log('🚀 Indeed AI Jobs Scraper - Amsterdam');
    console.log('='.repeat(60));
    console.log('📍 Location: Amsterdam, Netherlands');
    console.log('🔍 Job Board: Indeed');
    console.log('='.repeat(60));

    const searchTerms = [
        'AI Engineer',
        'Machine Learning Engineer',
        'Artificial Intelligence Engineer',
        'ML Engineer',
        'AI/ML Engineer',
        'Deep Learning Engineer',
        'NLP Engineer',
        'Computer Vision Engineer'
    ];

    const allJobsArray: any[] = [];

    for (const term of searchTerms) {
        console.log(`\n🔍 Searching for: "${term}" in Amsterdam...`);

        try {
            const jobs = await scrapeJobs({
                siteName: ['indeed'],
                searchTerm: term,
                location: 'Amsterdam',
                countryIndeed: 'netherlands',
                resultsWanted: 50,
                hoursOld: 168, // Last 7 days
                jobType: 'fulltime',
                isRemote: false,
                verbose: 0
            });

            if (jobs.length > 0) {
                console.log(`  ✅ Found ${jobs.length} jobs for "${term}"`);
                
                // Show a preview
                console.log(`  📋 Preview (first 2 jobs):`);
                console.log(jobs.head(2));

                // Save to temporary JSON file to extract data
                const tempFile = `temp_${Date.now()}.json`;
                await jobs.toJson(tempFile, { pretty: false });
                
                // Read the JSON file
                const fileContent = await fs.readFile(tempFile, 'utf-8');
                const jobsData = JSON.parse(fileContent);
                
                // Add search_term to each job
                jobsData.forEach((job: any) => {
                    job.search_term = term;
                    allJobsArray.push(job);
                });
                
                // Delete temp file
                await fs.unlink(tempFile);

                console.log(`  ✅ Added ${jobs.length} jobs to collection`);

            } else {
                console.log(`  ⚠️  No jobs found for "${term}"`);
            }

            // Rate limiting
            console.log(`  ⏳ Waiting 3 seconds before next search...`);
            await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error: any) {
            console.error(`  ❌ Error scraping "${term}":`, error.message);
        }
    }

    // Save combined results
    console.log('\n' + '='.repeat(60));
    console.log('💾 Saving all jobs to ONE combined file...');
    console.log('='.repeat(60));

    if (allJobsArray.length > 0) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `amsterdam_all_jobs_${timestamp}.json`;
        
        const combinedResults = {
            metadata: {
                total_jobs: allJobsArray.length,
                location: 'Amsterdam',
                country: 'Netherlands',
                search_terms: searchTerms,
                scraped_at: new Date().toISOString()
            },
            jobs: allJobsArray
        };

        await fs.writeFile(
            filename,
            JSON.stringify(combinedResults, null, 2)
        );

        console.log(`\n✅ Successfully saved: ${filename}`);
        console.log(`📊 Total jobs saved: ${allJobsArray.length}`);
        
        // Verify file was created
        const stats = await fs.stat(filename);
        console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
        console.log('\n⚠️  No jobs to save');
    }

    // Print summary statistics
    console.log('\n' + '='.repeat(60));
    console.log('📈 Summary Statistics:');
    console.log('='.repeat(60));
    console.log(`  Total jobs: ${allJobsArray.length}`);
    console.log(`  Search terms used: ${searchTerms.length}`);
    
    // Company statistics
    if (allJobsArray.length > 0) {
        const companies: { [key: string]: number } = {};
        allJobsArray.forEach(job => {
            if (job.company_name) {
                companies[job.company_name] = (companies[job.company_name] || 0) + 1;
            }
        });

        const topCompanies = Object.entries(companies)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        console.log('\n🏢 Top 10 Companies:');
        topCompanies.forEach(([company, count]) => {
            console.log(`  ${company}: ${count} jobs`);
        });

        // Jobs with email contacts
        const withEmails = allJobsArray.filter(job => job.emails && job.emails.length > 0).length;
        console.log(`\n📧 Jobs with contact emails: ${withEmails}`);

        // Jobs with company website
        const withWebsite = allJobsArray.filter(job => job.company_url_direct).length;
        console.log(`🌐 Jobs with company website: ${withWebsite}`);

        // Remote jobs
        const remoteJobs = allJobsArray.filter(job => job.is_remote).length;
        console.log(`🏠 Remote jobs: ${remoteJobs}`);

        // Jobs with salary info
        const withSalary = allJobsArray.filter(job => {
            return job.compensation?.min_amount || job.compensation?.max_amount || job.min_amount || job.max_amount;
        }).length;
        console.log(`💰 Jobs with salary info: ${withSalary}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Scraping session complete!');
    console.log('='.repeat(60));
    console.log(`\n📁 Output file: amsterdam_all_jobs_${new Date().toISOString().split('T')[0]}.json`);
    console.log(`📂 Saved in directory: ${process.cwd()}`);
}

main().catch(console.error);