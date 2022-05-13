const consulta_principal_url = "https://appscvsmovil.supercias.gob.ec/PortalInfor/consultaPrincipal.zul?id=1"

const home_page_url = 'https://www.supercias.gob.ec/portalscvs/'

const company_page = 'https://appscvs1.supercias.gob.ec/portalCia/contenedor.zul?param='

const company_documents_page_base = 'https://appscvsmovil.supercias.gob.ec/portaldedocumentos'

const company_documents_page = 'https://appscvsmovil.supercias.gob.ec/portaldedocumentos/consulta_cia_menu.zul'

const base_url_download = 'https://appscvsmovil.supercias.gob.ec/'

const isAtHomePage = page => 
		page.url() === home_page_url

const isAtConsultaPrincipal = page => 
		page.url() === consulta_principal_url

const isAtCompanyPage = page => {
		let re  = new RegExp(company_page + ".*");
		let res = page.url().match(re);
		if(res) return true
		else return false
}

const isAtCompanyDocumentsPage = page => {
		let re  = new RegExp(company_documents_page_base + ".*");
		let url = page.url();
		let base = url.match(re);
		let same = url === company_documents_page;
		if(base || same) return true
		else return false
}

export { 
		consulta_principal_url,
		home_page_url,
		base_url_download,
		isAtCompanyDocumentsPage,
		isAtConsultaPrincipal,
		isAtHomePage,
		isAtCompanyPage,
}
