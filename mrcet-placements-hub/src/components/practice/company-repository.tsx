import { companies } from "@/lib/data/companies";
import { companyResources } from "@/lib/data/practice";
import { ResourceCard } from "@/components/practice/resource-card";

export function CompanyRepository() {
  return (
    <div className="flex flex-col gap-10">
      {companies.map((company) => {
        const resources = companyResources.filter((resource) => resource.companySlug === company.slug);
        if (resources.length === 0) return null;
        return (
          <section key={company.slug}>
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                style={{ backgroundImage: `linear-gradient(135deg, ${company.colorFrom}, ${company.colorTo})` }}
                aria-hidden
              >
                {company.initials}
              </span>
              <h3 className="text-lg font-bold">{company.name}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource, index) => (
                <ResourceCard key={`${resource.companySlug}-${index}`} resource={resource} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
